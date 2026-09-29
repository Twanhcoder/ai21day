// Email sau khi đơn chuyển sang "đã thanh toán": xác nhận cho khách + báo đơn mới cho admin. Gửi qua Resend.
// Lỗi gửi mail chỉ ghi log, không làm hỏng luồng thanh toán.
// HTML email dùng table + inline style để hiển thị đúng trên Gmail, Outlook, Apple Mail.
const { db } = require('./_lib');

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vnd = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;
const when = (d) => new Date(d || Date.now()).toLocaleString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
});
const ZALO = 'https://zalo.me/0868532538';
const SITE = 'https://www.tuananhvu.com';
const FONT = "font-family:Helvetica,Arial,sans-serif;";

// Việc tiếp theo theo từng gói. Chỉ ghi điều chắc chắn sẽ xảy ra.
const NEXT_STEPS = {
  'coc-founding': {
    title: 'Suất Founding của bạn đã được giữ',
    steps: [
      'Tuấn Anh sẽ nhắn Zalo cho bạn trong vòng 24 giờ để xác nhận thông tin và lịch học.',
      'Khoản cọc 500.000đ được trừ thẳng vào học phí 990.000đ. Phần còn lại là 490.000đ, thanh toán trước ngày khai giảng.',
      'Khai giảng 12/10/2026, học trực tuyến. Nếu lớp không đủ điều kiện mở, bạn được hoàn lại toàn bộ tiền cọc.',
    ],
  },
  founding: {
    title: 'Suất tham gia 21AISYSTEM của bạn đã được kích hoạt',
    steps: [
      'Tuấn Anh sẽ nhắn Zalo cho bạn trong vòng 24 giờ, gửi link nhóm học và lịch 21 ngày.',
      'Khai giảng 12/10/2026, học trực tuyến, Demo Day 01/11/2026.',
      'Trước ngày khai giảng, bạn chuẩn bị giúp mình một máy tính và 2 giờ mỗi ngày cho thử thách.',
    ],
  },
};
const DEFAULT_STEPS = {
  title: 'Việc tiếp theo',
  steps: ['Tuấn Anh sẽ nhắn Zalo cho bạn trong vòng 24 giờ để hướng dẫn bước tiếp theo.'],
};

function detailsTable(title, rows) {
  const body = rows.map(([label, value, mono], i) => `
    <tr>
      <td style="${FONT}padding:16px 24px;font-size:15px;color:#6b6b6b;border-top:${i ? '1px solid #e6e6e6' : '0'};width:42%;">${label}</td>
      <td style="${FONT}padding:16px 24px;font-size:15px;color:#111111;font-weight:bold;border-top:${i ? '1px solid #e6e6e6' : '0'};${mono ? "font-family:'SFMono-Regular',Menlo,Consolas,monospace;letter-spacing:0.5px;" : ''}">${value}</td>
    </tr>`).join('');
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;border-radius:10px;border-collapse:separate;overflow:hidden;">
    <tr><td colspan="2" style="${FONT}background:#f5f5f5;padding:16px 24px;font-size:16px;font-weight:bold;color:#111111;border-bottom:1px solid #e0e0e0;">${title}</td></tr>
    ${body}
  </table>`;
}

function button(href, label) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="border-radius:8px;background:#111111;">
      <a href="${href}" target="_blank" style="${FONT}display:inline-block;padding:13px 24px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
    </td>
  </tr></table>`;
}

function layout({ preheader, badge, content, footer = 'Bạn nhận email này vì vừa thanh toán trên tuananhvu.com.' }) {
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>21AISYSTEM</title></head>
<body style="margin:0;padding:0;background:#f2f1f3;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f1f3;">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:14px;">
        <tr><td style="${FONT}padding:28px 32px 0;">
          <span style="font-size:14px;font-weight:bold;letter-spacing:2px;color:#111111;">21AISYSTEM</span>
          ${badge ? `<span style="float:right;display:inline-block;padding:5px 12px;border-radius:999px;background:#e7f6ed;color:#1b7a43;font-size:12px;font-weight:bold;">${badge}</span>` : ''}
        </td></tr>
        <tr><td style="${FONT}padding:24px 32px 32px;font-size:16px;line-height:1.65;color:#1a1a1a;">
          ${content}
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td style="${FONT}padding:20px 32px;font-size:12px;line-height:1.6;color:#8a8a8a;text-align:center;">
          Vũ Tuấn Anh · 21AISYSTEM · <a href="${SITE}" style="color:#8a8a8a;">tuananhvu.com</a><br>
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function customerEmail(o) {
  const c = o.customer;
  const next = NEXT_STEPS[o.product.slug] || DEFAULT_STEPS;
  const content = `
    <p style="margin:0 0 16px;">Chào ${esc(c.name)},</p>
    <p style="margin:0 0 28px;">Bạn đã hoàn tất thanh toán. Cảm ơn bạn đã tin tưởng và chọn đồng hành cùng 21AISYSTEM.</p>

    <p style="margin:0 0 12px;font-weight:bold;font-size:17px;color:#111111;">${esc(next.title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      ${next.steps.map((s, i) => `
      <tr>
        <td valign="top" style="${FONT}width:28px;padding:2px 0 10px;"><span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:50%;background:#111111;color:#ffffff;font-size:12px;font-weight:bold;text-align:center;">${i + 1}</span></td>
        <td style="${FONT}padding:0 0 10px 8px;font-size:15px;line-height:1.6;color:#1a1a1a;">${esc(s)}</td>
      </tr>`).join('')}
    </table>

    <p style="margin:0 0 12px;">Nếu cần trao đổi gấp, bạn nhắn trực tiếp cho mình qua Zalo:</p>
    ${button(ZALO, 'Nhắn Zalo cho Tuấn Anh')}

    <p style="margin:32px 0 4px;">Hẹn gặp bạn trong thử thách,</p>
    <p style="margin:0 0 32px;font-weight:bold;color:#111111;">Vũ Tuấn Anh<br><span style="font-weight:normal;color:#6b6b6b;font-size:14px;">Người đồng hành 21AISYSTEM</span></p>

    ${detailsTable('Thông tin đã thanh toán', [
      ['Người mua', esc(c.name)],
      ['Gói tham gia', esc(o.product.name)],
      ['Số tiền đã thanh toán', vnd(o.amount)],
      ['Mã chuyển khoản', esc(o.code), true],
      ['Thời gian', when(o.paid_at)],
    ])}

    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#8a8a8a;">Giữ lại email này và mã chuyển khoản để đối chiếu khi cần. Trả lời email này nếu thông tin có gì chưa đúng, mình sẽ phản hồi trong ngày.</p>`;

  return {
    subject: `Thanh toán thành công: ${o.product.name}`,
    html: layout({ preheader: `Đã nhận ${vnd(o.amount)} cho ${o.product.name}. Mã ${o.code}.`, badge: 'Đã thanh toán', content }),
    text: [
      `Chào ${c.name},`,
      '',
      'Bạn đã hoàn tất thanh toán. Cảm ơn bạn đã tin tưởng và chọn đồng hành cùng 21AISYSTEM.',
      '',
      next.title.toUpperCase(),
      ...next.steps.map((s, i) => `${i + 1}. ${s}`),
      '',
      `Cần trao đổi gấp: ${ZALO}`,
      '',
      'THÔNG TIN ĐÃ THANH TOÁN',
      `Người mua: ${c.name}`,
      `Gói tham gia: ${o.product.name}`,
      `Số tiền: ${vnd(o.amount)}`,
      `Mã chuyển khoản: ${o.code}`,
      `Thời gian: ${when(o.paid_at)}`,
      '',
      'Hẹn gặp bạn trong thử thách,',
      'Vũ Tuấn Anh, 21AISYSTEM',
    ].join('\n'),
  };
}

function adminEmail(o) {
  const c = o.customer;
  const via = o.paid_via === 'sepay' ? 'Sepay tự động' : 'Xác nhận tay';
  const content = `
    <p style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#111111;">+${vnd(o.amount)}</p>
    <p style="margin:0 0 24px;color:#6b6b6b;">${esc(c.name)} vừa thanh toán cho ${esc(o.product.name)}.</p>
    ${detailsTable('Chi tiết đơn', [
      ['Khách hàng', esc(c.name)],
      ['SĐT / Zalo', esc(c.phone)],
      ['Email', esc(c.email || 'Không có')],
      ['Gói', esc(o.product.name)],
      ['Mã đơn', esc(o.code), true],
      ['Xác nhận', via],
      ['Thời gian', when(o.paid_at)],
    ])}
    <p style="margin:24px 0 12px;">Nhắn Zalo cho khách trong 24 giờ như đã hứa trong email xác nhận.</p>
    ${button(`${SITE}/admin/`, 'Mở trang admin')}`;

  return {
    subject: `Đơn mới ${o.code}: ${vnd(o.amount)} từ ${c.name}`,
    html: layout({ preheader: `${c.name} · ${c.phone} · ${o.product.name}`, badge: 'Đơn mới', content }),
    text: `${c.name} vừa thanh toán ${vnd(o.amount)} cho ${o.product.name} (${via}).\nSĐT/Zalo: ${c.phone}\nEmail: ${c.email || 'không có'}\nMã đơn: ${o.code}\nThời gian: ${when(o.paid_at)}\n${SITE}/admin/`,
  };
}

async function send(payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function sendPaidEmails(orderId) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) return;
  try {
    const rows = await db(`orders?select=code,amount,paid_via,paid_at,customer:customers(name,phone,email),product:products(name,slug)&id=eq.${orderId}`);
    const o = rows[0];
    if (!o) return;
    const from = `Vũ Tuấn Anh <${process.env.MAIL_FROM}>`;
    const replyTo = process.env.ADMIN_EMAIL || undefined;
    const jobs = [];
    if (o.customer?.email) jobs.push(send({ from, to: o.customer.email, reply_to: replyTo, ...customerEmail(o) }));
    if (process.env.ADMIN_EMAIL) jobs.push(send({ from, to: process.env.ADMIN_EMAIL, ...adminEmail(o) }));
    const results = await Promise.allSettled(jobs);
    results.filter((r) => r.status === 'rejected').forEach((r) => console.error('mail error', r.reason));
  } catch (err) {
    console.error('mail error', err);
  }
}

module.exports = { sendPaidEmails, customerEmail, adminEmail, send, layout, button, esc, FONT, ZALO, SITE };
