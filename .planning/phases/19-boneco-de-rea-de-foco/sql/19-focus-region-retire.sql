-- REQ-30 boneco de área de foco. D-06.
-- Idempotente. O operador cola este arquivo no SQL Editor do Supabase e executa uma vez.
-- Aviso ao operador: não use supabase db push.
--
-- Apaga só as marcas das oito chaves que deixam de existir.
-- Não reparte a marca antiga nas partes novas.
-- Não apaga region_key nulo, coxa, joelho, ombro nem as outras regiões.
-- Não mexe na ficha JSON.
-- A constraint patient_focus_areas_region_key_format permanece como está.

delete from public.patient_focus_areas
where region_key in (
  'front.arm_l',
  'front.arm_r',
  'back.arm_l',
  'back.arm_r',
  'front.leg_l',
  'front.leg_r',
  'back.leg_l',
  'back.leg_r'
);

-- Prova no SQL Editor, depois do Success. Colar e executar à parte. Não faz parte deste Run.
-- Resultado esperado: zero linhas.
-- select region_key, count(*)
-- from public.patient_focus_areas
-- where region_key in (
--   'front.arm_l',
--   'front.arm_r',
--   'back.arm_l',
--   'back.arm_r',
--   'front.leg_l',
--   'front.leg_r',
--   'back.leg_l',
--   'back.leg_r'
-- )
-- group by region_key;

-- front.head, front.thigh_l e back.knee_r não entram no DELETE.
