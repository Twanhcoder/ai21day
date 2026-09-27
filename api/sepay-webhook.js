// POST /api/sepay-webhook — Sepay gọi khi tài khoản có biến động.
// Xác thực: header "Authorization: Apikey <SEPAY_API_KEY>". Sepay cần {success:true} + HTTP 200/201, nếu không sẽ retry.
const { db, HttpError, safeEqual, handle } = require('./_lib');

const CODE_RE = /AI21[A-Z0-9]{6}/i;

module.exports = handle(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
  const expected = process.env.SEPAY_API_KEY ? `Apikey ${process.env.SEPAY_API_KEY}` : '';
  if (!safeEqual(req.headers.authorization, expected)) throw new HttpError(401, 'Unauthorized');

  const p = req.body || {};
  if (!p.id) throw new HttpError(400, 'Thiếu id giao dịch');

  // Ghi log trước; trùng id (Sepay retry) thì bỏ qua để không xử lý 2 lần.
  const inserted = await db('sepay_transactions?on_conflict=id', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=representation',
    body: {
      id: p.id,
      gateway: p.gateway,
      transaction_date: p.transactionDate,
      account_number: p.accountNumber,
      code: p.code,
      content: p.content,
      transfer_type: p.transferType,
      transfer_amount: p.transferAmount,
      reference_code: p.referenceCode,
      raw: p,
    },
  });
  if (!inserted.length || p.transferType !== 'in') return res.status(200).json({ success: true });

  const code = String(p.code || '').match(CODE_RE)?.[0] || String(p.content || '').match(CODE_RE)?.[0];
  if (!code) return res.status(200).json({ success: true });

  const orders = await db(`orders?select=id,amount&status=eq.pending&code=eq.${code.toUpperCase()}`);
  // Chuyển thiếu tiền hoặc không khớp mã: giữ pending, admin xác nhận tay.
  if (!orders.length || Number(p.transferAmount) < orders[0].amount) return res.status(200).json({ success: true });

  await db(`orders?id=eq.${orders[0].id}&status=eq.pending`, {
    method: 'PATCH',
    body: { status: 'success', paid_via: 'sepay', sepay_tx_id: p.id, paid_at: new Date().toISOString() },
  });
  await db(`sepay_transactions?id=eq.${p.id}`, { method: 'PATCH', body: { order_id: orders[0].id } });
  res.status(200).json({ success: true });
});
