// POST /api/chat — chuyển câu hỏi trong ô chat sang agent tư vấn trên GoClaw (webhook llm).
// Token webhook chỉ nằm ở env server (GOCLAW_WEBHOOK_URL, GOCLAW_WEBHOOK_TOKEN), không lộ ra trình duyệt.
const { HttpError, clean, handle, clientIp, rateCount, rateHit } = require('./_lib');

const WEBHOOK_URL = process.env.GOCLAW_WEBHOOK_URL || 'https://bot.tuananhvu.com/v1/webhooks/llm';
const WEBHOOK_TOKEN = process.env.GOCLAW_WEBHOOK_TOKEN;
const TIMEOUT_MS = 45000;
const SESSION_RE = /^[a-z0-9-]{8,64}$/;

module.exports = handle(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
  if (!WEBHOOK_TOKEN) throw new HttpError(503, 'Trợ lý đang bảo trì');

  const b = req.body || {};
  const message = clean(b.message, 300);
  const session = String(b.session || '').toLowerCase();
  if (!message) throw new HttpError(400, 'Bạn chưa nhập câu hỏi');
  if (!SESSION_RE.test(session)) throw new HttpError(400, 'Phiên chat không hợp lệ');

  // Mỗi IP tối đa 20 câu / 10 phút, toàn site tối đa 300 câu / giờ (bảo vệ VPS 1 GB và quota model).
  const ipBucket = `chat:${clientIp(req)}`;
  if ((await rateCount(ipBucket, 10 * 60 * 1000, 20)) >= 20) throw new HttpError(429, 'Bạn hỏi hơi nhanh, đợi vài phút rồi hỏi tiếp nhé');
  if ((await rateCount('chat:all', 60 * 60 * 1000, 300)) >= 300) throw new HttpError(429, 'Trợ lý đang quá tải, bạn nhắn Zalo giúp mình nhé');
  await Promise.all([rateHit(ipBucket), rateHit('chat:all')]);

  let upstream;
  try {
    upstream = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WEBHOOK_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: message, session_key: `web-${session}`, mode: 'sync' }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.error('goclaw unreachable', err.name, err.message);
    throw new HttpError(504, 'Trợ lý phản hồi chậm, bạn thử lại hoặc nhắn Zalo nhé');
  }

  const data = await upstream.json().catch(() => null);
  if (!upstream.ok || typeof data?.output !== 'string') {
    console.error('goclaw error', upstream.status, data?.error || data?.code);
    throw new HttpError(upstream.status === 429 ? 429 : 502, 'Trợ lý đang bận, bạn thử lại sau ít phút hoặc nhắn Zalo nhé');
  }

  res.status(200).json({ reply: data.output.trim().slice(0, 4000) });
});
