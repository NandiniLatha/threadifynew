-- ── 1. Create admin_audit_logs table ──────────────────────────────────────────

CREATE TABLE public.admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  order_id uuid REFERENCES public.design_requests(id) ON DELETE SET NULL,
  dispute_id uuid REFERENCES public.disputes(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 2. Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ── 3. Policies ───────────────────────────────────────────────────────────────

-- Admins can view audit logs
CREATE POLICY "Allow admins to view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
    )
  );

-- Admins can insert audit logs
CREATE POLICY "Allow admins to insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'::user_role
    )
  );

-- Do not add UPDATE or DELETE policies (append-only)

-- ── 4. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_order_id ON public.admin_audit_logs(order_id);
CREATE INDEX idx_admin_audit_logs_dispute_id ON public.admin_audit_logs(dispute_id);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);
