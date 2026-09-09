-- 1. Fix direct helper recursion by using JWT metadata instead of is_admin() / is_tailor()
DROP POLICY IF EXISTS "users: admin full access" ON public.users;
CREATE POLICY "users: admin full access"
  ON public.users FOR ALL
  USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

DROP POLICY IF EXISTS "users: read assigned customer" ON public.users;
CREATE POLICY "users: read assigned customer"
  ON public.users FOR SELECT
  USING (
    role = 'customer' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'tailor' AND
    EXISTS (
      SELECT 1 FROM public.design_requests dr
      WHERE dr.customer_id = users.id AND (
        dr.tailor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.quotations q
          WHERE q.request_id = dr.id AND q.tailor_id = auth.uid()
        )
      )
    )
  );

-- 2. Fix the indirect recursion loop on design_requests querying users
DROP POLICY IF EXISTS "Allow tailors to read pending design requests" ON public.design_requests;
CREATE POLICY "Allow tailors to read pending design requests"
  ON public.design_requests FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'tailor' AND
    status = 'pending_bids'
  );
