import { supabase } from '@/lib/supabase/client'
import { escapeIlike, mapDbError, sanitizeText } from '@/lib/security'
import type {
  Category,
  Client,
  CompanySettings,
  Coupon,
  DashboardMetrics,
  DashboardPeriod,
  DashboardSalesPoint,
  Delivery,
  EmployeeRole,
  Expense,
  IngredientWithStock,
  Notification,
  OrderWithRelations,
  ProductWithCategory,
  ShoppingListItem,
  TaskStatus,
  TaskWithAssignee,
} from '@/types/database.types'
import type {
  ClientFormData,
  CompanyFormData,
  CouponFormData,
  DeliveryFormData,
  ExpenseFormData,
  IngredientFormData,
  OrderFormData,
  ProductFormData,
  RecipeFormData,
  StockMovementFormData,
  TaskFormData,
} from '@/schemas/modules.schema'

function throwDb(error: { message?: string; code?: string }): never {
  throw new Error(mapDbError(error))
}

// ---- Catalog ----
export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('name')
  if (error) throwDb(error)
  return data ?? []
}

export async function listProducts(): Promise<ProductWithCategory[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name)')
    .order('name')
  if (error) throwDb(error)
  return (data as ProductWithCategory[]) ?? []
}

export async function upsertProduct(id: string | null, form: ProductFormData) {
  const payload = {
    name: sanitizeText(form.name, 120),
    category_id: form.category_id,
    description: form.description ? sanitizeText(form.description, 2000) : null,
    price: form.price,
    weight_grams: form.weight_grams ?? null,
    production_time_minutes: form.production_time_minutes,
    is_active: form.is_active,
  }

  if (id) {
    const { error } = await supabase.from('products').update(payload).eq('id', id)
    if (error) throwDb(error)
  } else {
    const { error } = await supabase.from('products').insert(payload)
    if (error) throwDb(error)
  }
}

export async function listIngredients(): Promise<IngredientWithStock[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*, stock(current_quantity)')
    .order('name')
  if (error) throwDb(error)
  return (data as IngredientWithStock[]) ?? []
}

export async function upsertIngredient(id: string | null, form: IngredientFormData) {
  const payload = {
    name: sanitizeText(form.name, 120),
    unit: form.unit,
    minimum_quantity: form.minimum_quantity,
    supplier: form.supplier ? sanitizeText(form.supplier, 160) : null,
    is_active: form.is_active,
  }
  if (id) {
    const { error } = await supabase.from('ingredients').update(payload).eq('id', id)
    if (error) throwDb(error)
  } else {
    const { error } = await supabase.from('ingredients').insert(payload)
    if (error) throwDb(error)
  }
}

export async function createStockMovement(form: StockMovementFormData) {
  const { error } = await supabase.from('stock_movements').insert({
    ingredient_id: form.ingredient_id,
    movement_type: form.movement_type,
    quantity: form.quantity,
    reason: sanitizeText(form.reason, 500),
  })
  if (error) throwDb(error)
}

export async function listRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, products(id, name), recipe_items(*, ingredients(id, name, unit))')
    .order('created_at', { ascending: false })
  if (error) throwDb(error)
  return data ?? []
}

export async function saveRecipe(form: RecipeFormData, existingRecipeId?: string | null) {
  let recipeId = existingRecipeId ?? null

  if (!recipeId) {
    const { data: existing } = await supabase
      .from('recipes')
      .select('id')
      .eq('product_id', form.product_id)
      .maybeSingle()
    recipeId = existing?.id ?? null
  }

  if (!recipeId) {
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        product_id: form.product_id,
        yield_quantity: form.yield_quantity,
        instructions: form.instructions ? sanitizeText(form.instructions, 10000) : null,
      })
      .select('id')
      .single()
    if (error) throwDb(error)
    recipeId = data.id
  } else {
    const { error } = await supabase
      .from('recipes')
      .update({
        yield_quantity: form.yield_quantity,
        instructions: form.instructions ? sanitizeText(form.instructions, 10000) : null,
      })
      .eq('id', recipeId)
    if (error) throwDb(error)
  }

  // Busca itens atuais e sincroniza sem DELETE físico quando possível
  const { data: currentItems, error: curErr } = await supabase
    .from('recipe_items')
    .select('id, ingredient_id')
    .eq('recipe_id', recipeId)
  if (curErr) throwDb(curErr)

  const incomingIds = new Set(form.items.map((i) => i.ingredient_id))

  // Atualiza ou insere
  for (const item of form.items) {
    const existing = currentItems?.find((c) => c.ingredient_id === item.ingredient_id)
    if (existing) {
      const { error } = await supabase
        .from('recipe_items')
        .update({ quantity: item.quantity })
        .eq('id', existing.id)
      if (error) throwDb(error)
    } else {
      const { error } = await supabase.from('recipe_items').insert({
        recipe_id: recipeId,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
      })
      if (error) throwDb(error)
    }
  }

  // Remove itens que saíram (admin only — se falhar, ignora e mantém histórico)
  const toRemove = (currentItems ?? []).filter((c) => !incomingIds.has(c.ingredient_id))
  for (const rem of toRemove) {
    await supabase.from('recipe_items').delete().eq('id', rem.id)
  }
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('full_name')
  if (error) throwDb(error)
  return data ?? []
}

export async function upsertClient(id: string | null, form: ClientFormData) {
  const payload = {
    full_name: sanitizeText(form.full_name, 120),
    phone: sanitizeText(form.phone, 20),
    email: form.email ? sanitizeText(form.email.toLowerCase(), 254) : null,
    birth_date: form.birth_date || null,
    address: {
      street: form.address_street ? sanitizeText(form.address_street, 200) : '',
      city: form.address_city ? sanitizeText(form.address_city, 100) : '',
    },
    is_active: form.is_active,
  }
  if (id) {
    const { error } = await supabase.from('clients').update(payload).eq('id', id)
    if (error) throwDb(error)
  } else {
    const { error } = await supabase.from('clients').insert(payload)
    if (error) throwDb(error)
  }
}

export async function getClientHistory(clientId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total, scheduled_for, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throwDb(error)
  const totalSpent = (data ?? [])
    .filter((o) => o.status !== 'cancelado')
    .reduce((sum, o) => sum + Number(o.total), 0)
  return { orders: data ?? [], totalSpent }
}

export async function listCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) throwDb(error)
  return data ?? []
}

export async function upsertCoupon(id: string | null, form: CouponFormData) {
  const payload = {
    code: form.code,
    discount_percent: form.discount_percent,
    valid_until: new Date(form.valid_until).toISOString(),
    usage_limit: form.usage_limit ?? null,
    is_active: form.is_active,
  }
  if (id) {
    const { error } = await supabase.from('coupons').update(payload).eq('id', id)
    if (error) throwDb(error)
  } else {
    const { error } = await supabase.from('coupons').insert(payload)
    if (error) throwDb(error)
  }
}

export type OrderFilter = 'todos' | 'hoje' | 'amanha' | 'semana' | 'producao' | 'entregues'

export async function listOrders(filter: OrderFilter = 'todos'): Promise<OrderWithRelations[]> {
  let query = supabase
    .from('orders')
    .select('*, clients(id, full_name, phone), order_items(*, products(id, name))')
    .order('scheduled_for', { ascending: true })

  const now = new Date()
  const startToday = new Date(now)
  startToday.setHours(0, 0, 0, 0)
  const endToday = new Date(startToday)
  endToday.setDate(endToday.getDate() + 1)
  const endTomorrow = new Date(endToday)
  endTomorrow.setDate(endTomorrow.getDate() + 1)
  const endWeek = new Date(startToday)
  endWeek.setDate(endWeek.getDate() + 7)

  if (filter === 'hoje') {
    query = query.gte('scheduled_for', startToday.toISOString()).lt('scheduled_for', endToday.toISOString())
  } else if (filter === 'amanha') {
    query = query.gte('scheduled_for', endToday.toISOString()).lt('scheduled_for', endTomorrow.toISOString())
  } else if (filter === 'semana') {
    query = query.gte('scheduled_for', startToday.toISOString()).lt('scheduled_for', endWeek.toISOString())
  } else if (filter === 'producao') {
    query = query.eq('status', 'producao')
  } else if (filter === 'entregues') {
    query = query.eq('status', 'entregue')
  }

  const { data, error } = await query
  if (error) throwDb(error)
  return (data as OrderWithRelations[]) ?? []
}

export async function createOrder(form: OrderFormData) {
  const productIds = form.items.map((i) => i.product_id)
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, price, is_active')
    .in('id', productIds)
  if (prodErr) throwDb(prodErr)

  const priceMap = new Map((products ?? []).map((p) => [p.id, p]))
  let subtotal = 0
  const items = form.items.map((item) => {
    const product = priceMap.get(item.product_id)
    if (!product || !product.is_active) {
      throw new Error('Um dos produtos selecionados é inválido ou inativo.')
    }
    const unit_price = Number(product.price)
    subtotal += unit_price * item.quantity
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price,
    }
  })

  let couponId: string | null = null
  let discount = 0
  if (form.coupon_code) {
    const code = form.coupon_code.toUpperCase()
    const { data: coupon, error: couponErr } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle()
    if (couponErr) throwDb(couponErr)
    if (!coupon || new Date(coupon.valid_until) < new Date()) {
      throw new Error('Cupom inválido ou expirado.')
    }
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      throw new Error('Cupom esgotado.')
    }
    couponId = coupon.id
    discount = (subtotal * Number(coupon.discount_percent)) / 100
  }

  let deliveryFee = 0
  if (form.delivery_type === 'entrega') {
    const { data: settings } = await supabase.from('company_settings').select('delivery_fee').eq('id', 1).maybeSingle()
    deliveryFee = Number(settings?.delivery_fee ?? 0)
  }

  const total = subtotal - discount + deliveryFee

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      client_id: form.client_id,
      coupon_id: couponId,
      payment_method: form.payment_method,
      delivery_type: form.delivery_type,
      scheduled_for: new Date(form.scheduled_for).toISOString(),
      notes: form.notes ? sanitizeText(form.notes, 2000) : null,
      subtotal,
      discount_amount: discount,
      delivery_fee: deliveryFee,
      total,
      status: 'novo',
    })
    .select('id')
    .single()
  if (error) throwDb(error)

  const { error: itemsErr } = await supabase.from('order_items').insert(
    items.map((item) => ({ ...item, order_id: order.id })),
  )
  if (itemsErr) throwDb(itemsErr)

  return order.id
}

export async function confirmOrder(orderId: string) {
  const { error } = await supabase.rpc('confirm_order', { p_order_id: orderId })
  if (error) throwDb(error)
}

export async function cancelOrder(orderId: string) {
  const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
  if (error) throwDb(error)
}

export async function updateOrderStatus(orderId: string, status: 'saiu_para_entrega' | 'entregue') {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
  })
  if (error) throwDb(error)
}

export async function listProductions() {
  const { data, error } = await supabase
    .from('production')
    .select('*, production_items(*, products(id, name)), orders(id, status)')
    .order('scheduled_for', { ascending: false })
    .limit(100)
  if (error) throwDb(error)
  return data ?? []
}

export async function completeProduction(productionId: string) {
  const { error } = await supabase.rpc('complete_production', { p_production_id: productionId })
  if (error) throwDb(error)
}

export async function listDeliveries() {
  const { data, error } = await supabase
    .from('deliveries')
    .select(
      '*, delivery_items(*, orders(id, status, clients(full_name, phone))), courier:profiles!deliveries_courier_id_fkey(id, full_name)',
    )
    .order('scheduled_for', { ascending: false })
  if (error) {
    // Fallback se o nome da FK diferir
    const fallback = await supabase
      .from('deliveries')
      .select('*, delivery_items(*, orders(id, status, clients(full_name, phone)))')
      .order('scheduled_for', { ascending: false })
    if (fallback.error) throwDb(fallback.error)
    return fallback.data ?? []
  }
  return data ?? []
}

export async function createDelivery(form: DeliveryFormData) {
  const { data: delivery, error } = await supabase
    .from('deliveries')
    .insert({
      courier_id: form.courier_id || null,
      scheduled_for: new Date(form.scheduled_for).toISOString(),
      notes: form.notes ? sanitizeText(form.notes, 1000) : null,
      status: 'aguardando',
    })
    .select('id')
    .single()
  if (error) throwDb(error)

  const { error: itemsErr } = await supabase.from('delivery_items').insert(
    form.order_ids.map((orderId, index) => ({
      delivery_id: delivery.id,
      order_id: orderId,
      stop_order: index + 1,
    })),
  )
  if (itemsErr) throwDb(itemsErr)
}

export async function updateDeliveryStatus(id: string, status: Delivery['status']) {
  const payload: Record<string, unknown> = { status }
  if (status === 'em_rota') payload.started_at = new Date().toISOString()
  if (status === 'entregue') payload.completed_at = new Date().toISOString()

  const { error } = await supabase.from('deliveries').update(payload).eq('id', id)
  if (error) throwDb(error)
}

export async function listShoppingList(): Promise<ShoppingListItem[]> {
  const { data, error } = await supabase.from('shopping_list_view').select('*').order('name')
  if (error) throwDb(error)
  return data ?? []
}

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*').order('occurred_on', { ascending: false })
  if (error) throwDb(error)
  return data ?? []
}

export async function createExpense(form: ExpenseFormData) {
  const { error } = await supabase.from('expenses').insert({
    description: sanitizeText(form.description, 300),
    category: sanitizeText(form.category, 80),
    amount: form.amount,
    occurred_on: form.occurred_on,
  })
  if (error) throwDb(error)
}

export async function getFinanceSummary() {
  const now = new Date()
  const startToday = new Date(now)
  startToday.setHours(0, 0, 0, 0)
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: orders, error } = await supabase
    .from('orders')
    .select('total, created_at, status')
    .neq('status', 'cancelado')
    .gte('created_at', startMonth.toISOString())
  if (error) throwDb(error)

  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('amount, occurred_on')
    .gte('occurred_on', startMonth.toISOString().slice(0, 10))
  if (expErr) throwDb(expErr)

  const revenueToday = (orders ?? [])
    .filter((o) => new Date(o.created_at) >= startToday)
    .reduce((s, o) => s + Number(o.total), 0)
  const revenueMonth = (orders ?? []).reduce((s, o) => s + Number(o.total), 0)
  const expensesMonth = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const ticket = (orders ?? []).length ? revenueMonth / (orders ?? []).length : 0

  // last 7 days chart
  const days: Array<{ day: string; total: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startToday)
    d.setDate(d.getDate() - i)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const total = (orders ?? [])
      .filter((o) => {
        const t = new Date(o.created_at)
        return t >= d && t < next
      })
      .reduce((s, o) => s + Number(o.total), 0)
    days.push({ day: d.toISOString().slice(0, 10), total })
  }

  return {
    revenueToday,
    revenueMonth,
    expensesMonth,
    profit: revenueMonth - expensesMonth,
    ticket,
    salesLast7Days: days,
  }
}

export async function listEmployees() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('full_name')
  if (error) throwDb(error)
  return data ?? []
}

export async function adminUpdateProfile(_userId: string, _role: EmployeeRole, _isActive: boolean) {
  throw new Error('Operação desativada por motivos de segurança.')
}

export async function getCompanySettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase.from('company_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throwDb(error)
  return data
}

export async function updateCompanySettings(form: CompanyFormData) {
  const { error } = await supabase
    .from('company_settings')
    .update({
      name: sanitizeText(form.name, 120),
      phone: form.phone ? sanitizeText(form.phone, 20) : null,
      email: form.email ? sanitizeText(form.email.toLowerCase(), 254) : null,
      address: form.address ? sanitizeText(form.address, 500) : null,
      business_hours: form.business_hours ? sanitizeText(form.business_hours, 500) : null,
      delivery_fee: form.delivery_fee,
    })
    .eq('id', 1)
  if (error) throwDb(error)
}

// ---- Tarefas (quadro kanban) ----
export async function listTasks(): Promise<TaskWithAssignee[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!assigned_to(id, full_name)')
    .order('position')
    .order('created_at')
  if (error) throwDb(error)
  return (data as TaskWithAssignee[]) ?? []
}

export async function upsertTask(id: string | null, form: TaskFormData, status?: TaskStatus) {
  const payload: Record<string, unknown> = {
    title: sanitizeText(form.title, 160),
    description: form.description ? sanitizeText(form.description, 2000) : null,
    priority: form.priority,
    due_date: form.due_date || null,
    assigned_to: form.assigned_to || null,
  }

  if (id) {
    const { error } = await supabase.from('tasks').update(payload).eq('id', id)
    if (error) throwDb(error)
  } else {
    const { data: auth } = await supabase.auth.getUser()
    payload.created_by = auth.user?.id
    if (status) payload.status = status
    const { error } = await supabase.from('tasks').insert(payload)
    if (error) throwDb(error)
  }
}

export async function moveTask(id: string, status: TaskStatus, position: number) {
  const { error } = await supabase.from('tasks').update({ status, position }).eq('id', id)
  if (error) throwDb(error)
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throwDb(error)
}

// ---- Notificações ----
export async function listNotifications(): Promise<Notification[]> {
  const [{ data, error }, { data: dismissed, error: dismissError }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase.from('notification_dismissals').select('notification_id'),
  ])
  if (error) throwDb(error)
  // Se a tabela de dismissões ainda não existir, mostra tudo (sem crashar).
  if (dismissError && dismissError.code !== '42P01' && !dismissError.message?.includes('does not exist')) {
    throwDb(dismissError)
  }
  const hidden = new Set((dismissed ?? []).map((row: { notification_id: string }) => row.notification_id))
  return (data ?? []).filter((n) => !hidden.has(n.id)).slice(0, 30)
}

export async function dismissNotification(id: string) {
  // Preferência: RPC (marca pessoal como lida + registra dismissão).
  const { error: rpcError } = await supabase.rpc('dismiss_notification', {
    p_notification_id: id,
  })
  if (!rpcError) return

  // Fallback: insert direto (se a migration da RPC ainda não rodou, mas a tabela existe).
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throwDb(rpcError)

  const { error } = await supabase.from('notification_dismissals').insert({
    notification_id: id,
    user_id: auth.user.id,
  })
  if (error && error.code !== '23505') {
    throw new Error(mapDbError(error.message?.includes('does not exist') ? rpcError : error))
  }
}

function startOfLocalDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getPeriodStart(period: DashboardPeriod) {
  const start = startOfLocalDay()
  if (period === 'week') start.setDate(start.getDate() - 6)
  if (period === 'month') start.setDate(1)
  if (period === 'year') start.setMonth(0, 1)
  return start
}

function buildSalesSeries(
  period: DashboardPeriod,
  orders: Array<{ created_at: string; total: number }>,
): DashboardSalesPoint[] {
  const today = startOfLocalDay()

  if (period === 'year') {
    const points: DashboardSalesPoint[] = []
    for (let month = 0; month < 12; month++) {
      const start = new Date(today.getFullYear(), month, 1)
      const end = new Date(today.getFullYear(), month + 1, 1)
      if (start > today) break
      const total = orders
        .filter((o) => {
          const t = new Date(o.created_at)
          return t >= start && t < end
        })
        .reduce((sum, o) => sum + Number(o.total), 0)
      points.push({
        key: `${today.getFullYear()}-${String(month + 1).padStart(2, '0')}`,
        label: start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        total,
      })
    }
    return points
  }

  if (period === 'month') {
    const points: DashboardSalesPoint[] = []
    const daysInView = today.getDate()
    for (let day = 1; day <= daysInView; day++) {
      const start = new Date(today.getFullYear(), today.getMonth(), day)
      const end = new Date(today.getFullYear(), today.getMonth(), day + 1)
      const total = orders
        .filter((o) => {
          const t = new Date(o.created_at)
          return t >= start && t < end
        })
        .reduce((sum, o) => sum + Number(o.total), 0)
      points.push({
        key: start.toISOString().slice(0, 10),
        label: String(day),
        total,
      })
    }
    return points
  }

  // day + week: last 7 days
  const points: DashboardSalesPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const start = new Date(today)
    start.setDate(start.getDate() - i)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const total = orders
      .filter((o) => {
        const t = new Date(o.created_at)
        return t >= start && t < end
      })
      .reduce((sum, o) => sum + Number(o.total), 0)
    points.push({
      key: start.toISOString().slice(0, 10),
      label:
        period === 'day'
          ? start.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
          : start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total,
    })
  }
  return points
}

export async function getDashboardMetrics(period: DashboardPeriod = 'day'): Promise<DashboardMetrics> {
  const periodStart = getPeriodStart(period)
  const chartStart = period === 'day' || period === 'week' ? getPeriodStart('week') : periodStart

  const [{ data: rpcData, error: rpcError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.rpc('dashboard_metrics'),
    supabase
      .from('orders')
      .select('id, total, created_at, client_id, status, order_items(quantity)')
      .neq('status', 'cancelado')
      .gte('created_at', chartStart.toISOString()),
  ])
  if (rpcError) throwDb(rpcError)
  if (ordersError) throwDb(ordersError)

  const rpc = rpcData as unknown as {
    production_pending?: number
    low_stock_count?: number
    production_today?: Array<{ product_id: string; product_name: string; quantity: number }>
  }

  const periodOrders = (orders ?? []).filter((o) => new Date(o.created_at) >= periodStart)
  const cookiesSold = periodOrders.reduce((sum, order) => {
    const items = (order.order_items as Array<{ quantity: number }> | null) ?? []
    return sum + items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0)
  }, 0)
  const clients = new Set(periodOrders.map((o) => o.client_id).filter(Boolean))

  return {
    period,
    orders_count: periodOrders.length,
    production_pending: Number(rpc.production_pending ?? 0),
    cookies_sold: cookiesSold,
    revenue: periodOrders.reduce((sum, o) => sum + Number(o.total), 0),
    clients_count: clients.size,
    low_stock_count: Number(rpc.low_stock_count ?? 0),
    sales_series: buildSalesSeries(period, orders ?? []),
    production_today: rpc.production_today ?? [],
  }
}

export async function getReports() {
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select('quantity, total, product_id, products(name), orders(status, client_id, created_at)')
  if (error) throwDb(error)

  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  const clientMap = new Map<string, number>()

  for (const item of orderItems ?? []) {
    const order = item.orders as { status?: string; client_id?: string } | null
    if (!order || order.status === 'cancelado') continue

    const name = (item.products as { name?: string } | null)?.name ?? 'Produto'
    const current = productMap.get(item.product_id) ?? { name, qty: 0, revenue: 0 }
    current.qty += item.quantity
    current.revenue += Number(item.total)
    productMap.set(item.product_id, current)

    if (order.client_id) {
      clientMap.set(order.client_id, (clientMap.get(order.client_id) ?? 0) + Number(item.total))
    }
  }

  const products = [...productMap.values()].sort((a, b) => b.qty - a.qty)
  const topProducts = products.slice(0, 5)
  const bottomProducts = [...products].sort((a, b) => a.qty - b.qty).slice(0, 5)

  const clientIds = [...clientMap.keys()]
  let topClients: Array<{ name: string; total: number }> = []
  if (clientIds.length) {
    const { data: clients } = await supabase.from('clients').select('id, full_name').in('id', clientIds)
    topClients = [...clientMap.entries()]
      .map(([id, total]) => ({
        name: clients?.find((c) => c.id === id)?.full_name ?? 'Cliente',
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('quantity, ingredient_id, ingredients(name), movement_type')
    .eq('movement_type', 'consumo')
  const ingredientUse = new Map<string, { name: string; qty: number }>()
  for (const m of movements ?? []) {
    const name = (m.ingredients as { name?: string } | null)?.name ?? 'Ingrediente'
    const cur = ingredientUse.get(m.ingredient_id) ?? { name, qty: 0 }
    cur.qty += Number(m.quantity)
    ingredientUse.set(m.ingredient_id, cur)
  }
  const topIngredients = [...ingredientUse.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)

  const { data: productions } = await supabase
    .from('production')
    .select('id, status, scheduled_for, production_items(planned_quantity)')
    .order('scheduled_for', { ascending: false })
    .limit(30)

  return { topProducts, bottomProducts, topClients, topIngredients, productions: productions ?? [] }
}

export interface SearchResult {
  type: 'cliente' | 'produto' | 'pedido'
  id: string
  title: string
  subtitle: string
  path: string
}

export async function globalSearch(term: string): Promise<SearchResult[]> {
  const cleaned = escapeIlike(term)
  if (cleaned.length < 2) return []

  const results: SearchResult[] = []

  const [clientsRes, productsRes, ordersRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name, phone')
      .or(`full_name.ilike.%${cleaned}%,phone.ilike.%${cleaned}%`)
      .limit(5),
    supabase.from('products').select('id, name, price').ilike('name', `%${cleaned}%`).limit(5),
    supabase
      .from('orders')
      .select('id, status, total, clients(full_name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  if (clientsRes.error) throwDb(clientsRes.error)
  if (productsRes.error) throwDb(productsRes.error)
  if (ordersRes.error) throwDb(ordersRes.error)

  for (const c of clientsRes.data ?? []) {
    results.push({
      type: 'cliente',
      id: c.id,
      title: c.full_name,
      subtitle: c.phone,
      path: `/clientes?q=${encodeURIComponent(c.id)}`,
    })
  }

  for (const p of productsRes.data ?? []) {
    results.push({
      type: 'produto',
      id: p.id,
      title: p.name,
      subtitle: `R$ ${Number(p.price).toFixed(2)}`,
      path: `/produtos?q=${encodeURIComponent(p.id)}`,
    })
  }

  const needle = cleaned.toLowerCase()
  for (const o of ordersRes.data ?? []) {
    const clientName = (o.clients as { full_name?: string } | null)?.full_name ?? ''
    if (
      clientName.toLowerCase().includes(needle) ||
      o.id.toLowerCase().includes(needle) ||
      o.status.includes(needle)
    ) {
      results.push({
        type: 'pedido',
        id: o.id,
        title: `Pedido ${o.id.slice(0, 8)}`,
        subtitle: `${clientName} · ${o.status}`,
        path: `/pedidos?q=${encodeURIComponent(o.id)}`,
      })
    }
  }

  return results.slice(0, 12)
}

export function loyaltyFromSpent(total: number): 'bronze' | 'prata' | 'ouro' | 'diamante' {
  if (total >= 2000) return 'diamante'
  if (total >= 1000) return 'ouro'
  if (total >= 400) return 'prata'
  return 'bronze'
}
