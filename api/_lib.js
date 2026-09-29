// Helper dùng chung cho Vercel Functions. File bắt đầu bằng "_" nên Vercel không expose thành endpoint.
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Gọi PostgREST của Supabase bằng service_role (bỏ qua RLS, chỉ chạy phía server).
async function db(path, { method = 'GET', body, prefer } = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new HttpError(500, 'Server chưa cấu hình Supabase');
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message || `Supabase ${res.status}`;
    if (msg.includes('OUT_OF_STOCK')) throw new HttpError(409, 'Sản phẩm đã hết hàng');
    if (msg.includes('PRODUCT_NOT_FOUND')) throw new HttpError(404, 'Không tìm thấy sản phẩm');
    if (data?.code === '23503') throw new HttpError(409, 'Không xóa được vì đang có đơn hàng liên kết');
    if (data?.code === '23505') throw new HttpError(409, 'Dữ liệu bị trùng (số điện thoại hoặc slug đã tồn tại)');
    throw new HttpError(res.status >= 500 ? 502 : 400, msg);
  }
  return data;
}

// Chuẩn hóa SĐT Việt Nam về dạng 0xxxxxxxxx; trả null nếu sai định dạng.
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[\s.\-()]/g, '');
  const m = digits.match(/^(?:\+?84|0)([35789]\d{8})$/);
  return m ? `0${m[1]}` : null;
}

function isEmail(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(raw || '').trim());
}

function clean(value, max = 200) {
  const s = String(value ?? '').trim();
  return s ? s.slice(0, max) : null;
}

// Dùng cho form public: tạo khách mới theo SĐT. Khách đã có thì chỉ điền thêm trường đang trống,
// KHÔNG ghi đè — nếu ghi đè, ai biết SĐT cũng đổi được email của người khác và nhận email thanh toán của họ.
async function upsertCustomer(fields) {
  const payload = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null && v !== undefined));
  const inserted = await db('customers?on_conflict=phone', {
    method: 'POST',
    body: payload,
    prefer: 'resolution=ignore-duplicates,return=representation',
  });
  if (inserted.length) return inserted[0];

  const [existing] = await db(`customers?select=*&phone=eq.${payload.phone}`);
  const blanks = Object.fromEntries(Object.entries(payload).filter(([k]) => existing[k] === null || existing[k] === ''));
  if (!Object.keys(blanks).length) return existing;
  const [updated] = await db(`customers?id=eq.${existing.id}`, { method: 'PATCH', body: blanks, prefer: 'return=representation' });
  return updated;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
}

function qrUrl(amount, code) {
  const params = new URLSearchParams({
    acc: process.env.SEPAY_ACCOUNT || '',
    bank: process.env.SEPAY_BANK || '',
    amount: String(amount),
    des: code,
  });
  return `https://qr.sepay.vn/img?${params}`;
}

// Bọc handler: bắt lỗi và trả JSON thống nhất.
function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const known = err instanceof HttpError;
      if (!known) console.error(err);
      res.status(known ? err.status : 500).json({ error: known ? err.message : 'Lỗi hệ thống, thử lại sau' });
    }
  };
}

module.exports = { db, HttpError, normalizePhone, isEmail, clean, upsertCustomer, safeEqual, qrUrl, handle };
