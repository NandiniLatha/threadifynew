-- Update messages and disputes RLS to support the new tailor_id column on design_requests

DROP POLICY IF EXISTS "Allow participants of the request to read messages" ON public.messages;
CREATE POLICY "Allow participants of the request to read messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.design_requests
      WHERE design_requests.id = messages.order_id AND (
        design_requests.customer_id = auth.uid() OR
        design_requests.tailor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.quotations
          WHERE quotations.request_id = design_requests.id AND quotations.tailor_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Allow participants to insert messages" ON public.messages;
CREATE POLICY "Allow participants to insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.design_requests
      WHERE design_requests.id = order_id AND (
        design_requests.customer_id = auth.uid() OR
        design_requests.tailor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.quotations
          WHERE quotations.request_id = design_requests.id AND quotations.tailor_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Allow participants of design requests to read disputes" ON public.disputes;
CREATE POLICY "Allow participants of design requests to read disputes" ON public.disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.design_requests
      WHERE design_requests.id = disputes.order_id AND (
        design_requests.customer_id = auth.uid() OR
        design_requests.tailor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.quotations
          WHERE quotations.request_id = design_requests.id AND quotations.tailor_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Allow participants to insert disputes" ON public.disputes;
CREATE POLICY "Allow participants to insert disputes" ON public.disputes
  FOR INSERT WITH CHECK (
    auth.uid() = raised_by AND
    EXISTS (
      SELECT 1 FROM public.design_requests
      WHERE design_requests.id = order_id AND (
        design_requests.customer_id = auth.uid() OR
        design_requests.tailor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.quotations
          WHERE quotations.request_id = design_requests.id AND quotations.tailor_id = auth.uid()
        )
      )
    )
  );
