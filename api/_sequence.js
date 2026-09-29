// Chuỗi 3 email chăm sóc sau khi khách điền form /course/: chào mừng (ngay), chia sẻ giá trị (+2 ngày), mời tham gia (+1 ngày).
// Nội dung gốc ở my-brain/email_sequence.md, sửa thì sửa cả hai nơi.
// Tiến độ lưu trên customers: seq_step = số email đã gửi, seq_next_at = lúc gửi email kế tiếp (cron /api/cron-sequence quét).
// Email có "+test" gửi cả 3 ngay để kiểm tra — chỉ khi bật SEQUENCE_TEST_MODE=1 (tắt trên production để form không bị dùng spam người khác).
const { db } = require('./_lib');
const { send, layout, button, esc, FONT, ZALO, SITE } = require('./_mail');

const DAY = 24 * 60 * 60 * 1000;
const FOOTER = 'Bạn nhận email này vì đã đăng ký trên tuananhvu.com. Không muốn nhận tiếp, trả lời email này với chữ "dừng".';

// Mỗi khối: chuỗi = đoạn văn; { ol } / { ul } = danh sách; { quote } = câu dặn AI để chép; { button } / { link }: [href, label].
const EMAILS = [
  {
    subject: 'Mình nhận được đăng ký của bạn rồi',
    preheader: 'Trong 24 giờ mình sẽ nhắn Zalo cho bạn.',
    blocks: [
      'Mình là Tuấn Anh. Cảm ơn bạn đã để lại thông tin trên trang 21AISYSTEM.',
      'Kể nhanh một chút để bạn biết mình là ai. Ba năm trước mình là lập trình viên, lương 15 triệu, cuộc sống ổn. Rồi mình từ bỏ công việc ổn định ở công ty. Mình thử freelance, đến nay cũng được 3 năm rồi, và ở thời điểm hiện tại mình đang trên con đường lấy tấm bằng thạc sĩ. Mong muốn của mình là giúp các bạn sinh viên sắp ra trường và các bạn freelance có một công việc dựa vào chính những kỹ năng mình đang có.',
      'Mình làm chương trình này vì đoạn đường đó. Biết làm thì nhiều người biết. Cái khó là có người đầu tiên chịu trả tiền.',
      'Việc tiếp theo khá đơn giản:',
      { ol: [
        'Trong 24 giờ, mình nhắn Zalo cho bạn để hẹn một cuộc trao đổi ngắn, xem chương trình có hợp với bạn không.',
        'Hai ngày nữa, mình gửi bạn một email về cách chọn dịch vụ đầu tiên để bán. Cái này dùng được ngay, kể cả khi bạn không tham gia.',
      ] },
      'Nếu muốn nói chuyện sớm hơn, nhắn thẳng cho mình qua Zalo.',
      { button: [ZALO, 'Nhắn Zalo cho Tuấn Anh'] },
    ],
  },
  {
    subject: 'Doanh nghiệp nhỏ không mua "mình biết làm web"',
    preheader: 'Một bài tập 20 phút với Google Maps.',
    blocks: [
      'Hồi mới đi tìm khách, mình chào hàng bằng câu kiểu "mình làm được website, landing page, có gì cần cứ gọi". Nghe thì hơi phũ, nhưng thật: không ai cần một người "làm được website".',
      'Chủ quán, chủ spa không nghĩ bằng chữ website. Họ nghĩ bằng chuyện hằng ngày: khách nhắn Facebook lúc 10 giờ tối không ai trả lời, khách hỏi giá xong rồi mất hút, cuối tháng không biết khách đến từ đâu.',
      'Đó là lúc mình nhận ra: người ta trả tiền cho một chuyện được giải quyết, không trả tiền cho kỹ năng của mình.',
      'Vậy nên trước khi học thêm công cụ nào, bạn thử bài tập này. Mất khoảng 20 phút.',
      { ol: [
        'Mở Google Maps, gõ một ngành gần nhà bạn: spa, nha khoa, quán cà phê, trung tâm tiếng Anh.',
        'Mở 10 địa điểm đầu tiên. Ghi lại nơi nào chưa có website, hoặc có nhưng không có chỗ để đặt lịch, để lại số điện thoại.',
        'Chọn ngành có nhiều nơi "thiếu" nhất. Đó là ngách đầu tiên của bạn.',
      ] },
      'Xong bước 3, bạn nhờ AI viết giúp một câu chào hàng. Chép câu dặn này, điền vào chỗ trống:',
      { quote: 'Mình là sinh viên [ngành học], mình làm [dịch vụ, ví dụ: trang đặt lịch online] cho [ngành, ví dụ: spa]. Viết giúp mình một tin nhắn Zalo dưới 60 chữ gửi chủ [tên doanh nghiệp], nói về chuyện [vấn đề bạn thấy, ví dụ: khách không đặt lịch được ngoài giờ]. Giọng lịch sự, không bán hàng dồn dập.' },
      'Bạn chưa cần gửi tin nhắn đó cho ai. Chỉ cần có danh sách 10 nơi và một câu chào hàng nói đúng vấn đề của họ, bạn đã đi trước phần lớn người mới rồi.',
      'Mai mình gửi thêm một email, lần này nói rõ về chương trình 21 ngày.',
    ],
  },
  {
    subject: '3 suất đầu tiên của 21AISYSTEM',
    preheader: '990.000đ, khai giảng 12/10/2026, đo bằng khách trả tiền đầu tiên.',
    blocks: [
      'Hôm qua mình gửi bạn bài tập Google Maps. Nếu bạn đã làm, bạn có trong tay danh sách khách tiềm năng và một câu chào hàng. Phần khó hơn là nhắn đủ nhiều, báo giá không run tay, và giao việc cho ra hồn. 21AISYSTEM làm đúng phần đó, cùng bạn, trong 21 ngày.',
      'Mình nói thẳng: đây là đợt đầu tiên. Chưa có học viên cũ, chưa có case study. Vì vậy mình nhận 3 người, giá 990.000đ, và định nghĩa kết quả từ trước khi nhận tiền.',
      'Trong 21 ngày bạn sẽ có:',
      { ul: [
        'Một gói dịch vụ có giá rõ ràng cho một ngành cụ thể',
        '1-2 mẫu landing page thật làm bằng AI để làm portfolio',
        'Danh sách doanh nghiệp lấy từ Google Maps và bộ tin nhắn, báo giá',
        '30 doanh nghiệp thật đã được bạn nhắn chào hàng',
        'Mỗi bài nộp được mình review trực tiếp',
      ] },
      'Kết quả được đo thế này: có 1 khách trả tiền, bao nhiêu cũng được, cho dịch vụ bạn làm bằng AI, trong 45 ngày kể từ khai giảng. Nếu bạn nộp đủ 21 bài đúng hạn và đạt kết quả đó, mình hoàn 50% học phí, đổi lại bạn cho mình đăng case study công khai.',
      'Chương trình chưa hợp với bạn nếu bạn chỉ muốn học AI cho biết, không dành được 2 giờ mỗi ngày, hoặc đang tìm cách kiếm tiền nhanh không cần làm.',
      'Khai giảng 12/10/2026, học trực tuyến, Demo Day 01/11/2026. Nếu chưa chắc, bạn có thể cọc 500.000đ để giữ chỗ, khoản này trừ thẳng vào học phí và được hoàn lại toàn bộ nếu lớp không mở.',
      { button: [`${SITE}/thanh-toan/?p=founding`, 'Giữ 1 trong 3 suất'] },
      { link: [`${SITE}/thanh-toan/?p=coc-founding`, 'Hoặc cọc 500.000đ giữ chỗ'] },
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

function sequenceEmail(step, name) {
  const e = EMAILS[step];
  const hi = `Chào ${name || 'bạn'},`;
  const sign = 'Tuấn Anh';
  const content = `<p style="${P}">${esc(hi)}</p>${e.blocks.map(blockHtml).join('')}
    <p style="margin:24px 0 0;font-weight:bold;color:#111111;">${sign}</p>`;
  return {
    subject: e.subject,
    html: layout({ preheader: e.preheader, content, footer: FOOTER }),
    text: [hi, ...e.blocks.map(blockText), sign].join('\n\n'),
  };
}

const isTestEmail = (email) => /\+test/i.test(String(email || '').split('@')[0]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sendStep(c, step) {
  const from = `Vũ Tuấn Anh <${process.env.MAIL_FROM}>`;
  const replyTo = process.env.ADMIN_EMAIL || undefined;
  const headers = replyTo ? { 'List-Unsubscribe': `<mailto:${replyTo}?subject=dung>` } : undefined;
  return send({ from, to: c.email, reply_to: replyTo, headers, ...sequenceEmail(step, c.name) });
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
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM || !c?.email) return;
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
  const due = await db(`customers?select=id,name,email,seq_step&seq_step=in.(1,2)&seq_next_at=lte.${new Date().toISOString()}&email=not.is.null&order=seq_next_at.asc&limit=${limit}`);
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

module.exports = { startSequence, sendDueEmails, sequenceEmail, isTestEmail };
