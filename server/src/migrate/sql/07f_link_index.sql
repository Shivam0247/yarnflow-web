create index if not exists vl_extra_purchasecode on voucher_lines ((extra->>'purchaseCode')) where extra ? 'purchaseCode';
