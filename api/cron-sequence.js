// GET /api/cron-sequence — Vercel Cron gọi mỗi ngày, gửi email 2 và 3 cho khách đã đến hạn.
// Vercel tự gắn "Authorization: Bearer <CRON_SECRET>" khi gọi cron.
const { db, HttpError, safeEqual, handle } = require('./_lib');
const { sendDueEmails } = require('./_sequence');

module.exports = handle(async (req, res) => {
  if (!process.env.CRON_SECRET) throw new HttpError(500, 'Server chưa cấu hình CRON_SECRET');
  if (!safeEqual(req.headers.authorization, `Bearer ${process.env.CRON_SECRET}`)) throw new HttpError(401, 'Unauthorized');
  const result = await sendDueEmails();
  await db(`rate_events?created_at=lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`, { method: 'DELETE' });
  res.status(200).json(result);
});
