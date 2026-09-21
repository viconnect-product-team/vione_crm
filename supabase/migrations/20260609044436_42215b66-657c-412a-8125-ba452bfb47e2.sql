CREATE TABLE public.invoices (
  id text NOT NULL PRIMARY KEY,
  member_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  invoice_no text NOT NULL,
  year integer NOT NULL,
  amount bigint NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_at date,
  status text NOT NULL CHECK (status IN ('paid','unpaid','overdue')),
  method text CHECK (method IN ('bank','card','cash','ewallet')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.invoices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.invoice_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','sms','call','zalo')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  by_name text NOT NULL DEFAULT '',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.invoice_reminders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_reminders TO authenticated;
GRANT ALL ON public.invoice_reminders TO service_role;

ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read invoice_reminders" ON public.invoice_reminders FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage invoice_reminders" ON public.invoice_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_invoice_reminders_updated_at BEFORE UPDATE ON public.invoice_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.invoices (id, member_id, invoice_no, year, amount, due_date, paid_at, status, method)
SELECT
  'INV-'||m.fee_year||'-'||m.code,
  m.id,
  'INV-'||m.fee_year||'-'||m.code,
  m.fee_year,
  CASE m.level
    WHEN 'memberLevel.large' THEN 30000000
    WHEN 'memberLevel.medium' THEN 15000000
    WHEN 'memberLevel.small' THEN 5000000
    ELSE 1500000
  END,
  make_date(m.fee_year, 3, 31),
  CASE WHEN m.fee_paid THEN make_date(m.fee_year, 3, 31) - ((abs(hashtext(m.id)) % 60) + 1) ELSE NULL END,
  CASE
    WHEN m.fee_paid THEN 'paid'
    WHEN make_date(m.fee_year, 3, 31) < current_date THEN 'overdue'
    ELSE 'unpaid'
  END,
  CASE WHEN m.fee_paid THEN (ARRAY['bank','card','cash','ewallet'])[1 + (abs(hashtext(m.id)) % 4)] ELSE NULL END
FROM public.members m;

INSERT INTO public.invoice_reminders (invoice_id, channel, sent_at, by_name, note)
SELECT
  i.id,
  'email',
  now() - (((abs(hashtext(i.id)) % 20) + 1) || ' days')::interval,
  'Nguyễn Thu Hà',
  'Nhắc lần đầu'
FROM public.invoices i
WHERE i.status <> 'paid';