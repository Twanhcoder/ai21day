# MCP server — ai21day

Cho agent goClaw 4 tool làm việc thật trên website (xem `../mcp_functions_draft.md`):
`doi_tieu_de_landing`, `bao_cao_don_hom_nay`, `dang_ky_moi`, `tin_hieu_moi` (cho heartbeat — đánh dấu `notified_at` để không báo trùng).

Transport `streamable-http` (stateless), endpoint `POST /mcp`, health check `GET /health`.
Bắt buộc header `Authorization: Bearer <MCP_TOKEN>`.

## Biến môi trường

| Biến | Ghi chú |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Cùng giá trị với website trên Vercel |
| `MCP_TOKEN` | Chuỗi ngẫu nhiên ≥ 24 ký tự: `openssl rand -hex 32` |
| `MCP_HOST`, `MCP_PORT` | Local mặc định `127.0.0.1:3001`. Trên VPS do `docker-compose.yml` đặt (`0.0.0.0:3001` trong container) |

Trên VPS chỉ đặt `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MCP_TOKEN` vào `/opt/ai21day/.env` —
không chép key SePay / Resend / admin, MCP không cần.

## Chạy local

```bash
cd mcp && npm install
MCP_TOKEN=$(openssl rand -hex 32) node --env-file=../.env.local server.js
```

## Deploy lên VPS (Docker, chung mạng `goclaw_internal` với goClaw)

Không cài Node lên máy chủ — Node nằm trong image `node:22-alpine`. Container không mở port ra ngoài;
chỉ container trong mạng `goclaw_internal` gọi được `http://ai21day-mcp:3001`.
Compose riêng (không gộp vào compose goClaw) nên `deploy.sh` của goClaw không đụng tới MCP.

```bash
git clone https://github.com/Twanhcoder/ai21day /opt/ai21day
install -m 600 /dev/null /opt/ai21day/.env && nano /opt/ai21day/.env   # 3 biến ở trên
cd /opt/ai21day && docker compose -f mcp/docker-compose.yml up -d --build
docker logs -f ai21day-mcp   # log mọi lần gọi tool
```

Cập nhật: `cd /opt/ai21day && git pull && docker compose -f mcp/docker-compose.yml up -d --build`.

Nếu goClaw bị `docker compose down` (mạng `goclaw_internal` bị tạo lại), chạy lại lệnh `up -d` ở trên để MCP nối mạng lại.
Cập nhật goClaw bình thường bằng `deploy.sh` thì không ảnh hưởng.

## Kết nối goClaw

goClaw chặn URL trỏ về IP nội bộ (chống SSRF) nên phải cho phép host của MCP (1 lần):

```bash
echo 'GOCLAW_MCP_ALLOWED_HOSTS=ai21day-mcp' >> /opt/goclaw/.env
cd /opt/goclaw && docker compose -f docker-compose.prod.yml --env-file .env up -d goclaw   # tạo lại container goClaw (~vài giây gián đoạn)
```

Dashboard → Capabilities → MCP Servers → Add:

- Name `my-business` · Transport `streamable-http`
- URL `http://ai21day-mcp:3001/mcp`
- API key: giá trị `MCP_TOKEN` · Tool prefix `biz`

Chỉ cấp các tool `biz__*` cho **agent quản trị riêng** (Telegram của chủ), không cấp cho agent tư vấn công khai trên website.
