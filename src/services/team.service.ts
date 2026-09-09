import { supabase } from '@/lib/supabase/client'
import { normalizeJoinCode } from '@/lib/accountAccess'
import { mapDbError } from '@/lib/security'
import type { Membership, MembershipRole, MembershipStatus, Organization, TeamMember } from '@/types/account'

const MEMBERSHIP_COLUMNS = 'id, organization_id, profile_id, role, status'
const ORG_COLUMNS = 'id, owner_id, name, join_code'
const TEAM_MEMBER_COLUMNS = 'id, profile_id, role, status, profiles(full_name, email)'

interface MembershipRow {
  id: string
  organization_id: string
  profile_id: string
  role: MembershipRole
  status: MembershipStatus
}

interface OrganizationRow {
  id: string
  owner_id: string
  name: string
  join_code: string
}

interface ProfileEmbed {
  full_name: string | null
  email: string | null
}

interface TeamMemberRow {
  id: string
  profile_id: string
  role: MembershipRole
  status: MembershipStatus
  profiles: ProfileEmbed | ProfileEmbed[] | null
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  if (!data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user.id
}

function embedProfile(value: TeamMemberRow['profiles']): ProfileEmbed | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function mapMembership(row: MembershipRow): Membership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    profileId: row.profile_id,
    role: row.role,
    status: row.status,
  }
}

function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    joinCode: row.join_code,
  }
}

function mapTeamMember(row: TeamMemberRow): TeamMember {
  const profile = embedProfile(row.profiles)
  return {
    id: row.id,
    profileId: row.profile_id,
    fullName: profile?.full_name?.trim() || '',
    email: profile?.email?.trim() || '',
    status: row.status,
    role: row.role,
  }
}

/** Boolean only — never returns org name (T-03-04 / D-01). */
export async function lookupOrganizationByCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('lookup_organization_by_code', {
    p_code: normalizeJoinCode(code),
  })
  throwIfError(error)
  return Boolean(data)
}

export async function fetchMembership(profileId: string): Promise<Membership | null> {
  const { data, error } = await supabase
    .from('organization_memberships')
    .select(MEMBERSHIP_COLUMNS)
    .eq('profile_id', profileId)
    .maybeSingle()

  throwIfError(error)
  if (!data) return null
  return mapMembership(data as MembershipRow)
}

export async function fetchOwnerOrganization(): Promise<Organization | null> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_COLUMNS)
    .eq('owner_id', userId)
    .maybeSingle()

  throwIfError(error)
  if (!data) return null
  return mapOrganization(data as OrganizationRow)
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const userId = await requireUserId()
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  throwIfError(orgError)
  if (!org) return []

  const { data, error } = await supabase
    .from('organization_memberships')
    .select(TEAM_MEMBER_COLUMNS)
    .eq('organization_id', org.id)
    .neq('role', 'owner')
    .order('created_at', { ascending: true })

  throwIfError(error)
  return ((data ?? []) as TeamMemberRow[]).map(mapTeamMember)
}

export async function decideMembership(membershipId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('decide_membership', {
    p_membership_id: membershipId,
    p_accept: accept,
  })
  if (error) throw new Error(mapDbError(error))
}
