// POST /api/register — form đăng ký phỏng vấn trên /course/, lưu vào bảng customers.
const { HttpError, normalizePhone, isEmail, clean, upsertCustomer, handle } = require('./_lib');
const { startSequence } = require('./_sequence');

module.exports = handle(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot chống bot

  const name = clean(b.name, 100);
  const phone = normalizePhone(b.phone);
  const email = clean(b.email, 150);
  if (!name) throw new HttpError(400, 'Vui lòng nhập họ tên');
  if (!phone) throw new HttpError(400, 'Số điện thoại chưa đúng (VD: 0912345678)');
  if (email && !isEmail(email)) throw new HttpError(400, 'Email chưa đúng định dạng');

  const customer = await upsertCustomer({
    name,
    phone,
    zalo: phone,
    email: email?.toLowerCase(),
    email_consent_at: email && (b.email_consent === 'on' || b.email_consent === true) ? new Date().toISOString() : undefined,
    current_status: clean(b.current_status),
    major: clean(b.major),
    niche: clean(b.niche),
    paid_before: clean(b.paid_before),
    ai_level: clean(b.ai_level),
    note: clean(b.note, 1000),
    source: 'course-form',
  });
  // Chỉ vào chuỗi khi email đã lưu chính là email vừa nhập (khách cũ giữ email cũ thì không dùng sự đồng ý mới).
  if (email && customer.email === email.toLowerCase()) await startSequence(customer);
  res.status(200).json({ ok: true });
});
