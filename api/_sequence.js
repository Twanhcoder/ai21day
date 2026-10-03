// Chuỗi 3 email chăm sóc sau khi khách điền form /course/: chào mừng (ngay), chia sẻ giá trị (+2 ngày), mời tham gia (+1 ngày).
// Nội dung gốc ở my-brain/email_sequence.md, sửa thì sửa cả hai nơi.
// Tiến độ lưu trên customers: seq_step = số email đã gửi, seq_next_at = lúc gửi email kế tiếp (cron /api/cron-sequence quét).
// Email có "+test" gửi cả 3 ngay để kiểm tra — chỉ khi bật SEQUENCE_TEST_MODE=1 (tắt trên production để form không bị dùng spam người khác).
const crypto = require('crypto');
const { db } = require('./_lib');
const { send, layout, button, esc, FONT, ZALO, SITE } = require('./_mail');

const DAY = 24 * 60 * 60 * 1000;
const footer = (url) => `Bạn nhận email này vì đã tích đồng ý nhận email khi đăng ký trên tuananhvu.com. Không muốn nhận tiếp? <a href="${url}" style="color:#8a8a8a;">Hủy đăng ký</a>.`;

// Token hủy ký bằng HMAC theo id khách, không cần lưu thêm gì. Thiếu UNSUB_SECRET thì không gửi email nào.
const unsubToken = (id) => crypto.createHmac('sha256', process.env.UNSUB_SECRET).update(`unsub:${id}`).digest('hex');
const unsubUrl = (id) => `${SITE}/api/unsubscribe?id=${id}&t=${unsubToken(id)}`;

// Mỗi khối: chuỗi = đoạn văn; { ol } / { ul } = danh sách; { quote } = câu dặn AI để chép; { button } / { link }: [href, label].
const EMAILS = [
  {
    subject: 'Mình nhận được đăng ký của bạn rồi',
    preheader: 'Trong 24 giờ mình sẽ nhắn Zalo cho bạn.',
    blocks: [
      'Mình là Tuấn Anh. Cảm ơn bạn đã để lại thông tin trên trang 21AISYSTEM.',
      'Kể nhanh một chút để bạn biết mình là ai. Mình có nền tảng IT, từng thực tập và làm việc ở MISA, Rikkeisoft. Rồi mình từ bỏ công việc ổn định để tự làm. Đến nay mình làm web, AI và automation cho nhiều khách hàng, từ cá nhân kinh doanh, SME đến agency, và đang học thạc sĩ.',
      'Mình làm chương trình này vì thấy rất nhiều bạn sinh viên rải CV mà mail vẫn im lìm. Không phải vì CV viết chưa hay, mà vì chưa có bằng chứng đủ thật để người khác tin mình làm được việc. Một dự án đầu tay có người dùng thật, có link bấm vào xem được, sẽ nói thay bạn.',
      'Việc tiếp theo khá đơn giản:',
      { ol: [
        'Trong 24 giờ, mình nhắn Zalo cho bạn để hẹn một cuộc trao đổi ngắn, xem chương trình có hợp với bạn không.',
        'Hai ngày nữa, mình gửi bạn một email về cách tìm người dùng thật đầu tiên cho dự án của bạn. Cái này dùng được ngay, kể cả khi bạn không tham gia.',
      ] },
      'Nếu muốn nói chuyện sớm hơn, nhắn thẳng cho mình qua Zalo.',
      { button: [ZALO, 'Nhắn Zalo cho Tuấn Anh'] },
    ],
  },
  {
    subject: 'Project giả rất khó đưa vào CV',
    preheader: 'Một bài tập 20 phút để tìm người dùng thật đầu tiên.',
    blocks: [
      'Nhiều bạn làm project theo video hướng dẫn: một web bán hàng tưởng tượng, một app todo, một chatbot hỏi gì cũng trả lời. Làm xong thì đúng là có học được. Nhưng đưa vào CV thì nhà tuyển dụng đọc lướt qua, vì ai cũng có một cái giống vậy.',
      'Thứ làm một dự án khác đi là người dùng thật. Khi có người dùng thật, bạn có bối cảnh, có vấn đề cụ thể, có phản hồi chép nguyên văn, có kết quả ban đầu. Đó là những thứ không ai bịa ra được.',
      'Người dùng thật đầu tiên thường ở gần hơn bạn nghĩ. Bạn thử bài tập này, mất khoảng 20 phút.',
      { ol: [
        'Liệt kê 10 người hoặc nơi bạn quen có làm dịch vụ: người thân kinh doanh, shop nhỏ, CLB, trung tâm dạy thêm, homestay, spa, cửa hàng.',
        'Cạnh mỗi cái tên, ghi một vấn đề bạn thấy: khách nhắn không ai trả lời, không có chỗ xem giá, khách hỏi đi hỏi lại cùng một câu.',
        'Chọn 1 nơi gần ngành học của bạn nhất và có vấn đề rõ nhất. Đó là ứng viên người dùng đầu tiên của bạn.',
      ] },
      'Xong bước 3, bạn nhờ AI viết giúp một tin nhắn xin làm thử. Chép câu dặn này, điền vào chỗ trống:',
      { quote: 'Mình là sinh viên [ngành học]. Mình đang làm dự án đầu tay: dùng AI dựng một trang web nhỏ có form liên hệ, nút Zalo và trả lời câu hỏi thường gặp. Viết giúp mình một tin nhắn Zalo dưới 60 chữ gửi [tên người/nơi], xin làm thử miễn phí cho họ vì mình thấy [vấn đề bạn thấy]. Giọng gần gũi, không bán hàng.' },
      'Bạn chưa cần gửi tin nhắn đó ngay. Chỉ cần có một cái tên cụ thể và một vấn đề thật, bạn đã đi trước phần lớn người đang làm project giả rồi.',
      'Mai mình gửi thêm một email, lần này nói rõ về chương trình 21 ngày.',
    ],
  },
  {
    subject: '3 suất đầu tiên của 21AISYSTEM First Project Challenge',
    preheader: '21 ngày làm dự án đầu tay có người dùng thật. 990.000đ, khai giảng 12/10/2026.',
    blocks: [
      'Hôm qua mình gửi bạn bài tập tìm người dùng thật đầu tiên. Phần khó hơn là dựng xong một web/assistant chạy được cho họ, lấy phản hồi, rồi đóng gói thành thứ đưa được vào CV. 21AISYSTEM First Project Challenge làm đúng phần đó, cùng bạn, trong 21 ngày.',
      'Mình nói rõ từ đầu: chương trình này không hứa bạn có khách trong 21 ngày. Mục tiêu là làm xong một dự án đầu tay có người dùng thật, ghi được vào CV. Đây là đợt đầu tiên nên mình chỉ nhận 3 người.',
      'Sau 21 ngày bạn giữ lại:',
      { ul: [
        'Một web/assistant có người dùng thật đang dùng',
        'Case study 1 trang và một dòng CV/portfolio rõ ràng',
        'Một skill/SOP để làm lại lần sau',
        'Danh sách 30 doanh nghiệp cùng ngách và kế hoạch nhắn/follow-up sau Demo Day',
        'Kế hoạch 45 ngày tiếp cận khách trả tiền đầu tiên',
      ] },
      'Học phí 990.000đ. Bạn đặt cọc 300.000đ để giữ chỗ. Sau buổi khởi động 12/10, nếu thấy chương trình đúng thứ mình cần, bạn thanh toán 690.000đ còn lại. Nếu không phù hợp, bạn dừng lại và không cần đóng thêm.',
      'Nếu bạn nộp đủ 21 nhiệm vụ đúng hạn và có 1 khách trả tiền trong vòng 45 ngày kể từ ngày bắt đầu, mình hoàn 100% học phí, đổi lại bạn cho mình chia sẻ câu chuyện công khai. Đây là phần thưởng, không phải cam kết ra đơn.',
      'Chương trình chưa hợp với bạn nếu bạn chỉ muốn học AI cho biết, kỳ vọng có thu nhập chắc chắn trong 21 ngày, hoặc không dành được khoảng 2 giờ mỗi ngày.',
      'Khai giảng 12/10/2026, học trực tuyến, Demo Day 01/11/2026.',
      { button: [`${SITE}/course/#dang-ky`, 'Đăng ký phỏng vấn'] },
      { link: [`${SITE}/thanh-toan/?p=coc-founding`, 'Đã trao đổi với mình rồi? Cọc 300.000đ giữ chỗ'] },
      'Còn câu hỏi gì, bạn trả lời thẳng email này hoặc nhắn Zalo cho mình.',
    ],
  },
];

const P = 'margin:0 0 16px;';

function blockHtml(b) {
  if (typeof b === 'string') return `<p style="${P}">${esc(b)}</p>`;
  if (b.ol || b.ul) {
    const items = b.ol || b.ul;
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${items.map((s, i) => `
      <tr>
        <td valign="top" style="${FONT}padding:0 0 8px;font-size:16px;line-height:1.65;color:#111111;font-weight:bold;width:22px;">${b.ol ? `${i + 1}.` : '&bull;'}</td>
        <td style="${FONT}padding:0 0 8px 6px;font-size:16px;line-height:1.65;color:#1a1a1a;">${esc(s)}</td>
      </tr>`).join('')}</table>`;
  }
  if (b.quote) return `<div style="${FONT}margin:0 0 16px;padding:16px 20px;background:#f5f5f5;border-left:3px solid #111111;border-radius:6px;font-size:15px;line-height:1.65;color:#1a1a1a;">${esc(b.quote)}</div>`;
  if (b.button) return `<div style="margin:8px 0 16px;">${button(b.button[0], esc(b.button[1]))}</div>`;
  if (b.link) return `<p style="${P}font-size:14px;"><a href="${b.link[0]}" target="_blank" style="color:#1a1a1a;">${esc(b.link[1])}</a></p>`;
  return '';
}

function blockText(b) {
  if (typeof b === 'string') return b;
  if (b.ol) return b.ol.map((s, i) => `${i + 1}. ${s}`).join('\n');
  if (b.ul) return b.ul.map((s) => `- ${s}`).join('\n');
  if (b.quote) return `"${b.quote}"`;
  const [href, label] = b.button || b.link || [];
  return href ? `${label}: ${href}` : '';
}

function sequenceEmail(step, name, unsub) {
  const e = EMAILS[step];
  const hi = `Chào ${name || 'bạn'},`;
  const sign = 'Tuấn Anh';
  const content = `<p style="${P}">${esc(hi)}</p>${e.blocks.map(blockHtml).join('')}
    <p style="margin:24px 0 0;font-weight:bold;color:#111111;">${sign}</p>`;
  return {
    subject: e.subject,
    html: layout({ preheader: e.preheader, content, footer: footer(unsub) }),
    text: [hi, ...e.blocks.map(blockText), sign, `Hủy đăng ký: ${unsub}`].join('\n\n'),
  };
}

const isTestEmail = (email) => /\+test/i.test(String(email || '').split('@')[0]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sendStep(c, step) {
  const from = `Vũ Tuấn Anh <${process.env.MAIL_FROM}>`;
  const replyTo = process.env.ADMIN_EMAIL || undefined;
  const url = unsubUrl(c.id);
  const headers = { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
  return send({ from, to: c.email, reply_to: replyTo, headers, ...sequenceEmail(step, c.name, url) });
}

async function saveProgress(id, step) {
  const nextAt = step === 1 ? new Date(Date.now() + 2 * DAY) : step === 2 ? new Date(Date.now() + DAY) : null;
  await db(`customers?id=eq.${id}`, {
    method: 'PATCH',
    body: { seq_step: step, seq_next_at: nextAt && nextAt.toISOString() },
  });
}

// Gọi sau khi khách điền form. Mỗi địa chỉ email chỉ nhận chuỗi 1 lần, kể cả khi form gửi kèm SĐT khác
// (chặn việc dùng form để spam hộp thư người khác). Lỗi chỉ ghi log để không làm hỏng việc lưu đăng ký.
async function startSequence(c) {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM || !process.env.UNSUB_SECRET || !c?.email) return;
  if (!c.email_consent_at || c.unsubscribed_at) return;
  try {
    if (process.env.SEQUENCE_TEST_MODE === '1' && isTestEmail(c.email)) {
      for (let step = 0; step < EMAILS.length; step++) {
        if (step) await sleep(700); // Resend giới hạn 2 request/giây
        await sendStep(c, step);
      }
      await saveProgress(c.id, EMAILS.length);
      return;
    }
    if (c.seq_step) return;
    const sameEmail = await db(`customers?select=id&email=eq.${encodeURIComponent(c.email)}&seq_step=gte.1&id=neq.${c.id}&limit=1`);
    if (sameEmail.length) return;
    await sendStep(c, 0);
    await saveProgress(c.id, 1);
  } catch (err) {
    console.error('sequence error', err);
  }
}

// Cron gọi: gửi email kế tiếp cho những khách đã đến hạn.
async function sendDueEmails(limit = 50) {
  if (!process.env.UNSUB_SECRET) return { due: 0, sent: 0, skipped: 'thiếu UNSUB_SECRET' };
  const due = await db(`customers?select=id,name,email,seq_step&seq_step=in.(1,2)&seq_next_at=lte.${new Date().toISOString()}&email=not.is.null&email_consent_at=not.is.null&unsubscribed_at=is.null&order=seq_next_at.asc&limit=${limit}`);
  let sent = 0;
  for (const c of due) {
    try {
      if (sent) await sleep(700);
      await sendStep(c, c.seq_step);
      await saveProgress(c.id, c.seq_step + 1);
      sent++;
    } catch (err) {
      console.error('sequence error', c.id, err);
    }
  }
  return { due: due.length, sent };
}

module.exports = { startSequence, sendDueEmails, sequenceEmail, isTestEmail, unsubToken };
