-- Step 3k: numbering continues where the old software stopped. Each book takes the pattern of its latest
-- document (prefix, zero padding, "/26-27" year suffix) and each book + year counter starts after the
-- highest number already used with that prefix, so a new document never repeats an old number.
SELECT mig.note('numbering: start');
CREATE TEMP TABLE nb AS
SELECT v.id, v.book_id, v.fy_id, v.date, m[1] AS pfx, m[2] AS seq, m[3] IS NOT NULL AS fysfx
FROM public.vouchers v, regexp_match(v.number, '^(.*?)(\d{1,9})(/\d{2}-\d{2})?$') m
WHERE v.book_id IS NOT NULL;
CREATE TEMP TABLE bp AS
SELECT DISTINCT ON (book_id) book_id, pfx, fysfx, CASE WHEN seq ~ '^0' AND length(seq) > 1 THEN length(seq) ELSE 0 END AS pad
FROM nb ORDER BY book_id, date DESC, id DESC;
UPDATE public.books b SET prefix = bp.pfx, padding = bp.pad, with_fy_suffix = bp.fysfx
FROM bp WHERE b.id = bp.book_id AND length(bp.pfx) <= 12
  AND (b.prefix, b.padding, b.with_fy_suffix) IS DISTINCT FROM (bp.pfx, bp.pad, bp.fysfx);
INSERT INTO public.counters (book_id, fy_id, last_number)
SELECT nb.book_id, nb.fy_id, max(nb.seq::bigint)::int
FROM nb JOIN public.books b ON b.id = nb.book_id AND b.prefix = nb.pfx
WHERE nb.seq::bigint < 2000000000
GROUP BY 1, 2
ON CONFLICT (book_id, fy_id) DO UPDATE SET last_number = greatest(public.counters.last_number, excluded.last_number);
SELECT mig.note('numbering: books and counters');

-- the book a new document starts in: the one used most in the current books (UMIYA24 period), per type
UPDATE public.books b SET is_default = (b.id = d.book_id)
FROM (SELECT DISTINCT ON (bk.company_id, bk.voucher_type) bk.company_id, bk.voucher_type, bk.id AS book_id
      FROM public.books bk JOIN public.vouchers v ON v.book_id = bk.id AND v.ledger_period = 24
      GROUP BY bk.company_id, bk.voucher_type, bk.id ORDER BY bk.company_id, bk.voucher_type, count(*) DESC) d
WHERE b.company_id = d.company_id AND b.voucher_type = d.voucher_type AND b.is_default IS DISTINCT FROM (b.id = d.book_id);
SELECT mig.note('numbering: default books');
