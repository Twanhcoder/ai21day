// /api/unsubscribe?id=&t= — hủy nhận email chuỗi chăm sóc.
//   GET  → trang xác nhận có nút bấm (không hủy ngay, vì công cụ quét link trong email sẽ tự mở GET)
//   POST → hủy thật (nút trên trang, hoặc one-click của Gmail/Apple Mail qua header List-Unsubscribe-Post)
const { db, HttpError, safeEqual } = require('./_lib');
const { unsubToken } = require('./_sequence');

const page = (title, body) => `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:15vh auto;padding:0 20px;color:#1a1a1a;line-height:1.6;"><h1 style="font-size:22px;">${title}</h1>${body}</body></html>`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  try {
    const id = Number.parseInt(req.query.id, 10);
    if (!process.env.UNSUB_SECRET) throw new HttpError(500, 'Server chưa cấu hình');
    if (!(id > 0) || !safeEqual(req.query.t, unsubToken(id))) throw new HttpError(400, 'Liên kết không hợp lệ');

    if (req.method === 'POST') {
      await db(`customers?id=eq.${id}&unsubscribed_at=is.null`, { method: 'PATCH', body: { unsubscribed_at: new Date().toISOString(), seq_next_at: null } });
      return res.status(200).send(page('Đã hủy đăng ký', '<p>Bạn sẽ không nhận thêm email nào từ chuỗi này nữa.</p>'));
    }
    if (req.method === 'GET') {
      return res.status(200).send(page('Hủy nhận email?', `<p>Bấm nút dưới để dừng nhận email từ 21AISYSTEM.</p>
<form method="post" action="/api/unsubscribe?id=${id}&t=${encodeURIComponent(req.query.t)}"><button type="submit" style="padding:12px 22px;font-size:16px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer;">Hủy đăng ký</button></form>`));
    }
    throw new HttpError(405, 'Method not allowed');
  } catch (err) {
    const known = err instanceof HttpError;
    if (!known) console.error(err);
    res.status(known ? err.status : 500).send(page('Có lỗi', `<p>${known ? err.message : 'Lỗi hệ thống, thử lại sau.'}</p>`));
  }
};
