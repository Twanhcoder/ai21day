// Logic 3 tool MCP. Dùng chung db() với API Vercel nên đọc/ghi đúng Supabase của website.
const { db } = require('../api/_lib');

const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // Việt Nam UTC+7, không có giờ mùa hè

// 0h ngày `ymd` (YYYY-MM-DD) giờ Việt Nam, trả về Date UTC.
const vnDayStart = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - VN_OFFSET_MS);
};
const vnToday = () => new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
const vnTime = (iso) => (iso ? new Date(new Date(iso).getTime() + VN_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ') : null);
const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;

// Dữ liệu đi qua Telegram + nhà cung cấp LLM nên luôn che bớt.
const maskPhone = (p) => (p && p.length >= 7 ? `${p.slice(0, 4)}***${p.slice(-3)}` : p || null);
const maskEmail = (e) => {
  if (!e || !e.includes('@')) return null;
  const [user, domain] = e.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
};

const HERO_KEYS = ['hero_title_1', 'hero_title_2'];

async function doiTieuDeLanding({ dong_1, dong_2 = '' }) {
  const next = { hero_title_1: dong_1.trim(), hero_title_2: dong_2.trim() };
  if (!next.hero_title_1) throw new Error('dong_1 không được để trống');

  const rows = await db(`site_settings?select=key,value&key=in.(${HERO_KEYS.join(',')})`);
  const prev = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const updatedAt = new Date().toISOString();
  await db('site_settings?on_conflict=key', {
    method: 'POST',
    body: HERO_KEYS.map((key) => ({ key, value: next[key], updated_at: updatedAt, updated_by: 'mcp' })),
    prefer: 'resolution=merge-duplicates',
  });

  const join = (o) => [o.hero_title_1, o.hero_title_2].filter(Boolean).join(' / ');
  return {
    tieu_de_cu: join(prev),
    tieu_de_moi: join(next),
    cap_nhat_luc: vnTime(updatedAt),
    ghi_chu: 'Khách refresh trang chủ sau khoảng 5 giây là thấy tiêu đề mới.',
  };
}

async function baoCaoDonHomNay({ ngay } = {}) {
  const day = ngay || vnToday();
  const from = vnDayStart(day);
  if (Number.isNaN(from.getTime())) throw new Error('ngay phải có dạng YYYY-MM-DD');
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);

  const orders = await db(
    `orders?select=code,amount,status,paid_at,created_at,product:products(name)` +
      `&created_at=gte.${from.toISOString()}&created_at=lt.${to.toISOString()}&order=created_at.desc`
  );
  const by = (s) => orders.filter((o) => o.status === s);
  const paid = by('success');
  return {
    ngay: day,
    tong_don: orders.length,
    da_thanh_toan: paid.length,
    doanh_thu: vnd(paid.reduce((sum, o) => sum + o.amount, 0)),
    cho_thanh_toan: by('pending').length,
    da_huy: by('cancelled').length,
    danh_sach: orders.slice(0, 20).map((o) => ({
      ma: o.code,
      san_pham: o.product?.name || null,
      so_tien: vnd(o.amount),
      trang_thai: o.status,
      tao_luc: vnTime(o.created_at),
      thanh_toan_luc: vnTime(o.paid_at),
    })),
  };
}

async function dangKyMoi({ so_ngay = 1, gioi_han = 10 } = {}) {
  const from = new Date(vnDayStart(vnToday()).getTime() - (so_ngay - 1) * 24 * 60 * 60 * 1000);
  const filter = `source=eq.course-form&created_at=gte.${from.toISOString()}`;
  const [rows, all] = await Promise.all([
    db(`customers?select=name,phone,email,niche,ai_level,created_at&${filter}&order=created_at.desc&limit=${gioi_han}`),
    db(`customers?select=id&${filter}`),
  ]);
  return {
    tu_ngay: vnTime(from.toISOString()).slice(0, 10),
    tong_dang_ky: all.length,
    danh_sach: rows.map((c) => ({
      ten: c.name,
      sdt: maskPhone(c.phone),
      email: maskEmail(c.email),
      linh_vuc: c.niche,
      trinh_do_ai: c.ai_level,
      dang_ky_luc: vnTime(c.created_at),
    })),
  };
}

module.exports = { doiTieuDeLanding, baoCaoDonHomNay, dangKyMoi, maskPhone, maskEmail, vnDayStart };
