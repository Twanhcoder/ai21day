// MCP server (streamable-http, stateless) cho goClaw. Chạy trên VPS, không public ra internet.
// Env: MCP_TOKEN (bắt buộc), MCP_HOST (mặc định 127.0.0.1), MCP_PORT (mặc định 3001), + SUPABASE_* của website.
const http = require('http');
const { z } = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { safeEqual } = require('../api/_lib');
const { doiTieuDeLanding, baoCaoDonHomNay, dangKyMoi, tinHieuMoi } = require('./tools');

const TOKEN = process.env.MCP_TOKEN;
const HOST = process.env.MCP_HOST || '127.0.0.1';
const PORT = Number(process.env.MCP_PORT) || 3001;
const MAX_BODY = 100 * 1024;

if (!TOKEN || TOKEN.length < 24) {
  console.error('MCP_TOKEN chưa set hoặc quá ngắn (cần >= 24 ký tự). Dừng.');
  process.exit(1);
}

const log = (entry) => console.log(JSON.stringify({ ts: new Date().toISOString(), ...entry }));

// Bọc tool: log mọi lần gọi, trả kết quả/ lỗi dạng text JSON cho agent đọc.
const wrap = (name, fn) => async (args) => {
  const started = Date.now();
  try {
    const result = await fn(args);
    log({ tool: name, args, ok: true, ms: Date.now() - started });
    return { content: [{ type: 'text', text: JSON.stringify({ ok: true, ...result }, null, 2) }] };
  } catch (err) {
    log({ tool: name, args, ok: false, ms: Date.now() - started, error: err.message });
    return { isError: true, content: [{ type: 'text', text: JSON.stringify({ ok: false, error: err.message }) }] };
  }
};

const titleLine = z.string().trim().max(60, 'Tối đa 60 ký tự').regex(/^[^<>]*$/, 'Không dùng ký tự < >');

function buildServer() {
  const server = new McpServer({ name: 'ai21day-business', version: '1.0.0' });

  server.registerTool(
    'doi_tieu_de_landing',
    {
      title: 'Đổi tiêu đề landing',
      description:
        'Đổi tiêu đề lớn (hero) trên trang chủ tuananhvu.com. Tiêu đề hiển thị 2 dòng: dong_1 là phần chính, ' +
        'dong_2 là phần nối tiếp (có thể bỏ trống). Câu dài thì tự tách thành 2 dòng cân đối. ' +
        'Khách refresh sau ~5 giây là thấy.',
      inputSchema: {
        dong_1: titleLine.min(1, 'dong_1 không được để trống').describe('Dòng 1 của tiêu đề'),
        dong_2: titleLine.optional().describe('Dòng 2 của tiêu đề (tùy chọn)'),
      },
    },
    wrap('doi_tieu_de_landing', doiTieuDeLanding)
  );

  server.registerTool(
    'bao_cao_don_hom_nay',
    {
      title: 'Báo cáo đơn hàng trong ngày',
      description:
        'Báo cáo đơn hàng của 1 ngày theo giờ Việt Nam: tổng đơn, đã thanh toán, doanh thu, đơn chờ/huỷ, danh sách đơn. ' +
        'Bỏ trống ngay = hôm nay. "Hôm qua" thì tự tính ngày dạng YYYY-MM-DD.',
      inputSchema: {
        ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dạng YYYY-MM-DD').optional().describe('Ngày cần báo cáo, YYYY-MM-DD'),
      },
    },
    wrap('bao_cao_don_hom_nay', baoCaoDonHomNay)
  );

  server.registerTool(
    'dang_ky_moi',
    {
      title: 'Người đăng ký khoá học mới',
      description:
        'Danh sách người vừa điền form đăng ký khoá 21AISYSTEM (SĐT/email đã che bớt). ' +
        'so_ngay=1 là từ 0h hôm nay, 3 là từ 0h của 2 ngày trước.',
      inputSchema: {
        so_ngay: z.number().int().min(1).max(30).optional().describe('Số ngày tính lùi, mặc định 1'),
        gioi_han: z.number().int().min(1).max(50).optional().describe('Số người tối đa trả về, mặc định 10'),
      },
    },
    wrap('dang_ky_moi', dangKyMoi)
  );

  server.registerTool(
    'tin_hieu_moi',
    {
      title: 'Tín hiệu mới cho heartbeat',
      description:
        'Dùng trong heartbeat: trả về đơn vừa thanh toán thành công và người vừa đăng ký khoá học MÀ CHƯA ĐƯỢC BÁO, ' +
        'kèm tổng hôm nay (đơn, doanh thu, số người đăng ký). Gọi xong là các mục đó bị đánh dấu đã báo, lần sau không trả lại — ' +
        'nên có kết quả thì phải nhắn chủ ngay. co_tin_moi=false nghĩa là không có gì mới.',
      inputSchema: {},
    },
    wrap('tin_hieu_moi', tinHieuMoi)
  );

  return server;
}

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Body quá lớn'), { status: 413 })); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined); }
      catch { reject(Object.assign(new Error('JSON không hợp lệ'), { status: 400 })); }
    });
    req.on('error', reject);
  });

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

http
  .createServer(async (req, res) => {
    const path = req.url.split('?')[0];
    if (path === '/health') return sendJson(res, 200, { ok: true });
    if (path !== '/mcp') return sendJson(res, 404, { error: 'Not found' });

    const auth = req.headers.authorization || '';
    if (!safeEqual(auth.replace(/^Bearer\s+/i, ''), TOKEN)) {
      log({ event: 'auth_failed', ip: req.socket.remoteAddress });
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
    // Stateless: không giữ session nên chỉ nhận POST.
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

    try {
      const body = await readJson(req);
      const server = buildServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => { transport.close(); server.close(); });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      log({ event: 'request_error', error: err.message });
      if (!res.headersSent) sendJson(res, err.status || 500, { error: err.status ? err.message : 'Internal error' });
    }
  })
  .listen(PORT, HOST, () => log({ event: 'listening', host: HOST, port: PORT }));
