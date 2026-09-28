// Email sau khi đơn chuyển sang "đã thanh toán": xác nhận cho khách + báo đơn mới cho admin. Gửi qua Resend.
// Lỗi gửi mail chỉ ghi log, không làm hỏng luồng thanh toán.
const { db } = require('./_lib');

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vnd = (n) => `${Number(n).toLocaleString('vi-VN')}đ`;
const ZALO = 'https://zalo.me/0868532538';

async function send(payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function customerEmail(o) {
  const c = o.customer;
  return {
    subject: `Đã nhận thanh toán đơn ${o.code}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111;max-width:520px">
<p>Chào ${esc(c.name)},</p>
<p>Mình đã nhận được thanh toán của bạn. Cảm ơn bạn nhiều!</p>
<table style="border-collapse:collapse;margin:16px 0">
<tr><td style="padding:4px 16px 4px 0;color:#666">Mã đơn</td><td><strong>${esc(o.code)}</strong></td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#666">Sản phẩm</td><td>${esc(o.product.name)}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#666">Số tiền</td><td>${vnd(o.amount)}</td></tr>
</table>
<p>Bước tiếp theo: Tuấn Anh sẽ nhắn Zalo cho bạn qua số <strong>${esc(c.phone)}</strong> trong hôm nay. Nếu cần gấp, bạn nhắn trước tại <a href="${ZALO}">${ZALO}</a>.</p>
<p>Giữ lại email này làm biên nhận nhé.</p>
<p>Vũ Tuấn Anh<br>21AISYSTEM · tuananhvu.com</p>
</div>`,
    text: `Chào ${c.name},\n\nMình đã nhận được thanh toán của bạn.\nMã đơn: ${o.code}\nSản phẩm: ${o.product.name}\nSố tiền: ${vnd(o.amount)}\n\nTuấn Anh sẽ nhắn Zalo cho bạn qua số ${c.phone} trong hôm nay. Cần gấp: ${ZALO}\n\nVũ Tuấn Anh\n21AISYSTEM`,
  };
}

function adminEmail(o) {
  const c = o.customer;
  const via = o.paid_via === 'sepay' ? 'Sepay tự động' : 'Xác nhận tay';
  return {
    subject: `Đơn mới ${o.code}: ${vnd(o.amount)} từ ${c.name}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
<p><strong>${esc(c.name)}</strong> vừa thanh toán ${vnd(o.amount)} cho ${esc(o.product.name)} (${via}).</p>
<p>SĐT/Zalo: ${esc(c.phone)}<br>Email: ${esc(c.email || 'không có')}<br>Mã đơn: ${esc(o.code)}</p>
<p><a href="https://www.tuananhvu.com/admin/">Mở trang admin</a></p>
</div>`,
    text: `${c.name} vừa thanh toán ${vnd(o.amount)} cho ${o.product.name} (${via}).\nSĐT/Zalo: ${c.phone}\nEmail: ${c.email || 'không có'}\nMã đơn: ${o.code}`,
  };
}

async function sendPaidEmails(orderId) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) return;
  try {
    const rows = await db(`orders?select=code,amount,paid_via,customer:customers(name,phone,email),product:products(name)&id=eq.${orderId}`);
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

module.exports = { sendPaidEmails };
