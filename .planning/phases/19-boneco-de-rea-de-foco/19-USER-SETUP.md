# Phase 19: User Setup Required

**Generated:** 2026-09-24
**Phase:** 19-boneco-de-rea-de-foco
**Status:** Incomplete

The silhouette and the PDF already use the 42-key catalog. The hosted AI summary still lists the old keys until this function is published. The app does not deploy Edge Functions and does not run `supabase db push`.

## Environment Variables

None.

## Dashboard Configuration

- [ ] **Publish patient-ai-summary from the phase 13 source**
  - Location: Supabase Dashboard → Edge Functions → patient-ai-summary
  - Set to: the function body in `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`
  - Notes: Do not publish `.planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts`. Do not use `supabase db push`. Until this deploy, the client still drops any `region_key` outside `z.enum(FOCUS_REGION_KEYS)`, so an old function cannot write `front.arm_l` back into the app.

## Verification

After the Dashboard shows the function deployed:

- The published source contains `front.palm_l`, `front.foot_r`, `back.hand_l`, and `back.ankle_r`
- The published source does not contain `front.arm_l`, `front.arm_r`, `back.arm_l`, `back.arm_r`, `front.leg_l`, `front.leg_r`, `back.leg_l`, or `back.leg_r`
- The comment on that set says 42 keys

---

**Once all items complete:** Mark status as "Complete" at top of file.
