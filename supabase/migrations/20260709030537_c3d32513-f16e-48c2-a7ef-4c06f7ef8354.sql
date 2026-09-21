-- 1. associations: stop exposing internal domain/SSL columns to anonymous public
-- Restrict anon SELECT to safe branding columns only (RLS policy still gates by landing_published).
REVOKE SELECT ON public.associations FROM anon;
GRANT SELECT (
  id, name, slug, logo_url, brand_primary, tagline, about, contact_email,
  landing_published, subdomain, custom_domain,
  public_card_enabled, public_card_requires_active_member,
  created_at, updated_at
) ON public.associations TO anon;

-- 2. invoice_reminders: scope admin access to the invoice's association
DROP POLICY IF EXISTS invoice_reminders_select_auth ON public.invoice_reminders;
DROP POLICY IF EXISTS invoice_reminders_admin_insert ON public.invoice_reminders;
DROP POLICY IF EXISTS invoice_reminders_admin_update ON public.invoice_reminders;
DROP POLICY IF EXISTS invoice_reminders_admin_delete ON public.invoice_reminders;

CREATE POLICY invoice_reminders_select_auth ON public.invoice_reminders
  FOR SELECT TO authenticated
  USING (
    is_platform_admin() OR EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_reminders.invoice_id
        AND has_assoc_role(i.association_id, 'admin'::app_role)
    )
  );

CREATE POLICY invoice_reminders_admin_insert ON public.invoice_reminders
  FOR INSERT TO authenticated
  WITH CHECK (
    is_platform_admin() OR EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_reminders.invoice_id
        AND has_assoc_role(i.association_id, 'admin'::app_role)
    )
  );

CREATE POLICY invoice_reminders_admin_update ON public.invoice_reminders
  FOR UPDATE TO authenticated
  USING (
    is_platform_admin() OR EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_reminders.invoice_id
        AND has_assoc_role(i.association_id, 'admin'::app_role)
    )
  )
  WITH CHECK (
    is_platform_admin() OR EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_reminders.invoice_id
        AND has_assoc_role(i.association_id, 'admin'::app_role)
    )
  );

CREATE POLICY invoice_reminders_admin_delete ON public.invoice_reminders
  FOR DELETE TO authenticated
  USING (
    is_platform_admin() OR EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_reminders.invoice_id
        AND has_assoc_role(i.association_id, 'admin'::app_role)
    )
  );

-- 3. member_account_audit: scope admin read to the member's association
DROP POLICY IF EXISTS "Admins can view member account audit" ON public.member_account_audit;

CREATE POLICY "Admins can view member account audit" ON public.member_account_audit
  FOR SELECT TO authenticated
  USING (
    is_platform_admin() OR EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = member_account_audit.member_id
        AND is_assoc_manager(m.association_id)
    )
  );