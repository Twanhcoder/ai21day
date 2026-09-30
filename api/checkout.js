// /api/checkout
//   GET  ?products=1      → danh sách sản phẩm đang bán
//   GET  ?code=AI21XXXXXX → trạng thái đơn (trang thanh toán poll)
//   POST {name, phone, email, product} → tạo khách + đơn pending, trả QR Sepay
const { db, HttpError, normalizePhone, isEmail, clean, upsertCustomer, qrUrl, handle, clientIp, rateCount, rateHit } = require('./_lib');

module.exports = handle(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET' && req.query.products) {
    const rows = await db('products?select=slug,name,type,price,description,stock&active=eq.true&order=price.asc');
    return res.status(200).json(rows.filter((p) => p.type !== 'physical' || p.stock > 0));
  }

  if (req.method === 'GET') {
    const code = String(req.query.code || '').toUpperCase();
    if (!/^AI21[A-Z0-9]{6}$/.test(code)) throw new HttpError(400, 'Mã đơn không hợp lệ');
    const rows = await db(`orders?select=code,status,amount,paid_at&code=eq.${code}`);
    if (!rows.length) throw new HttpError(404, 'Không tìm thấy đơn');
    return res.status(200).json(rows[0]);
  }

  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot chống bot

  // Mỗi IP tối đa 10 đơn/giờ; mỗi khách tối đa 3 đơn chờ thanh toán trong 24 giờ (đơn chờ đã trừ tồn kho hàng vật lý).
  const ipBucket = `checkout:${clientIp(req)}`;
  if ((await rateCount(ipBucket, 60 * 60 * 1000, 10)) >= 10) throw new HttpError(429, 'Bạn thao tác quá nhiều, thử lại sau ít phút');
  await rateHit(ipBucket);
  const name = clean(b.name, 100);
  const phone = normalizePhone(b.phone);
  const email = clean(b.email, 150);
  if (!name) throw new HttpError(400, 'Vui lòng nhập họ tên');
  if (!phone) throw new HttpError(400, 'Số điện thoại chưa đúng (VD: 0912345678)');
  if (!email || !isEmail(email)) throw new HttpError(400, 'Email chưa đúng định dạng');

  const slug = clean(b.product, 60);
  const products = await db(`products?select=id,name&active=eq.true&slug=eq.${encodeURIComponent(slug || '')}`);
  if (!products.length) throw new HttpError(404, 'Không tìm thấy sản phẩm');

  const customer = await upsertCustomer({ name, phone, zalo: phone, email: email.toLowerCase(), source: 'checkout' });
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const pending = await db(`orders?select=id&customer_id=eq.${customer.id}&status=eq.pending&created_at=gte.${since}&limit=3`);
  if (pending.length >= 3) throw new HttpError(429, 'Bạn đang có 3 đơn chờ thanh toán, hoàn tất hoặc chờ đơn cũ hết hạn');
  const order = await db('rpc/create_order', {
    method: 'POST',
    body: { p_customer_id: customer.id, p_product_id: products[0].id, p_quantity: 1 },
  });

  res.status(201).json({
    code: order.code,
    amount: order.amount,
    status: order.status,
    product: products[0].name,
    qr: qrUrl(order.amount, order.code),
    bank: process.env.SEPAY_BANK,
    account: process.env.SEPAY_ACCOUNT,
    accountName: process.env.SEPAY_ACCOUNT_NAME || 'VU TUAN ANH',
  });
});
