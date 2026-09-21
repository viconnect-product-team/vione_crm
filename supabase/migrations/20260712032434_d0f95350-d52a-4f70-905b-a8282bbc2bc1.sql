ALTER TABLE public.members ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
UPDATE public.members SET payment_status = 'paid' WHERE fee_paid = true AND payment_status = 'unpaid';
ALTER TABLE public.members ADD CONSTRAINT members_payment_status_chk CHECK (payment_status IN ('unpaid','pending','paid'));