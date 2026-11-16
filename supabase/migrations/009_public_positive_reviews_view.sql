-- Public-safe view exposing only positive (4-5 star) reviews without customer_email
CREATE OR REPLACE VIEW public.public_positive_reviews AS
SELECT
  id,
  COALESCE(NULLIF(trim(customer_name), ''), 'Khách TUNN') AS customer_name,
  table_number,
  rating,
  tags,
  comment,
  created_at
FROM public.table_feedback
WHERE rating >= 4
ORDER BY created_at DESC
LIMIT 24;

GRANT SELECT ON public.public_positive_reviews TO anon, authenticated;
