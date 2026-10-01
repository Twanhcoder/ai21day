// GET /api/settings — nội dung landing lấy từ bảng site_settings (đổi được qua MCP).
const { db, HttpError, handle } = require('./_lib');

// Chỉ trả các key public; thêm key mới vào đây khi landing cần.
const PUBLIC_KEYS = ['hero_title_1', 'hero_title_2'];

module.exports = handle(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed');
  const rows = await db(`site_settings?select=key,value&key=in.(${PUBLIC_KEYS.join(',')})`);
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  // Cache ngắn ở CDN: đổi tiêu đề xong, khách refresh sau vài giây là thấy.
  res.setHeader('Cache-Control', 'public, s-maxage=5');
  res.status(200).json(settings);
});
