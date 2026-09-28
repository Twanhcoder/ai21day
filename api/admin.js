// /api/admin?resource=products|customers|orders[&id=] — CRUD cho trang /admin.
// Bảo vệ bằng header "x-admin-key" = ADMIN_PASSWORD.
const { db, HttpError, normalizePhone, isEmail, clean, safeEqual, handle } = require('./_lib');
const { sendPaidEmails } = require('./_mail');

const toInt = (v) => (v === '' || v === null || v === undefined ? null : Number.parseInt(v, 10));

const RESOURCES = {
  products: {
    list: 'products?select=*&order=created_at.desc',
    fields(b) {
      const type = b.type;
      if (!['physical', 'digital', 'service'].includes(type)) throw new HttpError(400, 'Loại sản phẩm không hợp lệ');
      const price = toInt(b.price);
      if (!clean(b.name) || !clean(b.slug) || !(price >= 0)) throw new HttpError(400, 'Cần tên, slug và giá hợp lệ');
      const stock = type === 'physical' ? toInt(b.stock) : null;
      if (type === 'physical' && !(stock >= 0)) throw new HttpError(400, 'Sản phẩm vật lý cần số lượng tồn kho');
      return {
        name: clean(b.name),
        slug: clean(b.slug, 60).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        type,
        price,
        stock,
        description: clean(b.description, 1000),
        active: b.active !== false && b.active !== 'false',
      };
    },
  },
  customers: {
    list: 'customers?select=*&order=created_at.desc',
    fields(b) {
      const phone = normalizePhone(b.phone);
      if (!clean(b.name)) throw new HttpError(400, 'Cần họ tên');
      if (!phone) throw new HttpError(400, 'Số điện thoại chưa đúng');
      if (b.email && !isEmail(b.email)) throw new HttpError(400, 'Email chưa đúng');
      return {
        name: clean(b.name, 100),
        phone,
        zalo: clean(b.zalo) || phone,
        email: clean(b.email, 150)?.toLowerCase() || null,
        major: clean(b.major),
        niche: clean(b.niche),
        note: clean(b.note, 1000),
        source: clean(b.source) || 'admin',
      };
    },
  },
  orders: {
    list: 'orders?select=*,customer:customers(name,phone),product:products(name,type)&order=created_at.desc',
  },
};

async function handleOrders(req, res, id) {
  const b = req.body || {};
  if (req.method === 'POST') {
    const order = await db('rpc/create_order', {
      method: 'POST',
      body: { p_customer_id: toInt(b.customer_id), p_product_id: toInt(b.product_id), p_quantity: toInt(b.quantity) || 1 },
    });
    if (b.status === 'success') {
      await db(`orders?id=eq.${order.id}`, { method: 'PATCH', body: { status: 'success', paid_via: 'manual', paid_at: new Date().toISOString() } });
      await sendPaidEmails(order.id);
    }
    return res.status(201).json(order);
  }
  if (!id) throw new HttpError(400, 'Thiếu id');
  if (req.method === 'PATCH') {
    if (!['pending', 'success', 'cancelled'].includes(b.status)) throw new HttpError(400, 'Trạng thái không hợp lệ');
    const patch = { status: b.status };
    if (b.status === 'success') Object.assign(patch, { paid_via: 'manual', paid_at: new Date().toISOString() });
    if (b.status === 'pending') Object.assign(patch, { paid_via: null, paid_at: null });
    // Đơn đã hủy không mở lại, tránh lệch tồn kho.
    const [before] = await db(`orders?select=status&id=eq.${id}`);
    const rows = await db(`orders?id=eq.${id}&status=neq.cancelled`, { method: 'PATCH', body: patch, prefer: 'return=representation' });
    if (!rows.length) throw new HttpError(409, 'Đơn đã hủy, không đổi trạng thái được');
    if (b.status === 'success' && before?.status === 'pending') await sendPaidEmails(id);
    return res.status(200).json(rows[0]);
  }
  if (req.method === 'DELETE') {
    // Hủy trước để trigger trả lại tồn kho (nếu là hàng vật lý), rồi mới xóa.
    await db(`orders?id=eq.${id}&status=neq.cancelled`, { method: 'PATCH', body: { status: 'cancelled' } });
    await db(`sepay_transactions?order_id=eq.${id}`, { method: 'PATCH', body: { order_id: null } });
    await db(`orders?id=eq.${id}`, { method: 'DELETE' });
    return res.status(204).end();
  }
  throw new HttpError(405, 'Method not allowed');
}

module.exports = handle(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!safeEqual(req.headers['x-admin-key'], process.env.ADMIN_PASSWORD)) throw new HttpError(401, 'Sai mật khẩu admin');

  const resource = RESOURCES[req.query.resource];
  if (!resource) throw new HttpError(404, 'Resource không tồn tại');
  const id = toInt(req.query.id);

  if (req.method === 'GET') return res.status(200).json(await db(resource.list));
  if (req.query.resource === 'orders') return handleOrders(req, res, id);

  const table = req.query.resource;
  if (req.method === 'POST') {
    const rows = await db(table, { method: 'POST', body: resource.fields(req.body || {}), prefer: 'return=representation' });
    return res.status(201).json(rows[0]);
  }
  if (!id) throw new HttpError(400, 'Thiếu id');
  if (req.method === 'PATCH') {
    const rows = await db(`${table}?id=eq.${id}`, { method: 'PATCH', body: resource.fields(req.body || {}), prefer: 'return=representation' });
    return res.status(200).json(rows[0]);
  }
  if (req.method === 'DELETE') {
    await db(`${table}?id=eq.${id}`, { method: 'DELETE' });
    return res.status(204).end();
  }
  throw new HttpError(405, 'Method not allowed');
});
