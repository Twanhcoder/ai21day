/* Trợ lý tư vấn 21AISYSTEM: kịch bản cố định, nội dung lấy từ sales_script.md */
(() => {
  const GROUP_URL = 'https://zalo.me/g/bq4q5hq8kew3eoxlrmod';
  const zaloUrl = document.body.dataset.zaloUrl?.trim() || 'https://zalo.me/0868532538';

  const GREETING = 'Chào bạn, mình là trợ lý tự động của 21AISYSTEM. Mình trả lời theo những gì Tuấn Anh đã soạn sẵn. Câu nào mình chưa chắc, mình chuyển bạn sang Zalo gặp Tuấn Anh luôn.';
  const CLOSE = 'Nếu thấy hợp, bước tiếp theo là form phỏng vấn 3 phút. Gửi form không mất phí, Tuấn Anh sẽ nhắn Zalo hẹn trao đổi ngắn. Founding chỉ có 3 suất.';

  const STUDENT_TEXT = 'Đúng người chương trình dành cho. Ngành nào cũng được, ngành bạn học chính là ngách khách đầu tiên của bạn. Bạn đang băn khoăn chuyện gì nhất?';
  const ROLES = [
    { id: 'student', label: 'Sinh viên', text: STUDENT_TEXT },
    { id: 'graduate', label: 'Mới ra trường', text: STUDENT_TEXT },
    { id: 'worker', label: 'Đã đi làm, muốn làm thêm freelance', text: 'Chương trình thiết kế cho sinh viên sắp và mới ra trường. Nếu bạn chưa có khách freelance nào và có 2 giờ mỗi ngày, cứ điền form, hai bên trao đổi xem có hợp không. Bạn đang băn khoăn chuyện gì nhất?' },
    { id: 'owner', label: 'Chủ doanh nghiệp', text: '21AISYSTEM là chương trình dành cho người đi tìm khách freelance đầu tiên. Nếu bạn là doanh nghiệp, bạn nhắn trực tiếp Tuấn Anh qua Zalo để được tư vấn thêm nhé.' }
  ];

  const GROUPS = [
    { id: 'fit', label: 'Mình có hợp không' },
    { id: 'learn', label: 'Học gì, làm gì' },
    { id: 'money', label: 'Học phí và rủi ro' },
    { id: 'after', label: 'Chuẩn bị và sau 21 ngày' }
  ];

  const QUESTIONS = [
    { id: 'major', group: 'fit', label: 'Mình học ngành không liên quan IT, có theo được không?',
      keys: ['nganh', 'it', 'kinh te', 'du lich', 'y duoc', 'ngon ngu', 'su pham', 'marketing', 'phu hop', 'hop khong', 'theo duoc'],
      text: 'Được. Ngành bạn học lại là lợi thế: học du lịch thì làm cho homestay, y dược làm cho phòng khám, sư phạm làm cho trung tâm dạy thêm, kinh tế làm cho cửa hàng, spa. Bạn hiểu ngành đó hơn một bạn IT, và hiểu khách là thứ doanh nghiệp cần nhất.' },
    { id: 'code', group: 'fit', label: 'Mình không biết code thì sao?',
      keys: ['code', 'lap trinh', 'ky thuat', 'khong biet', 'dev', 'web'],
      text: 'AI làm phần code. Bạn cần dùng được máy tính và biết chat với AI ở mức cơ bản. 21 ngày không biến bạn thành dev, nó giúp bạn làm ra được landing page cho khách và tự sửa được nó.' },
    { id: 'time', group: 'fit', label: 'Mình còn đi học, đi làm, có theo kịp không?',
      keys: ['bao lau', 'thoi gian', 'may gio', 'moi ngay', 'lich', 'khi nao', 'bat dau', 'khai giang', 'online', 'truc tuyen', 'offline', 'di hoc', 'di lam', 'kip'],
      text: 'Cần 2 giờ mỗi ngày trong 21 ngày, từ 12/10 đến 01/11, học trực tuyến. Nếu thật sự không có 2 giờ mỗi ngày thì đợt này chưa hợp với bạn.' },
    { id: 'shy', group: 'fit', label: 'Mình ngại nhắn tin chào hàng lắm.',
      keys: ['ngai', 'nhan tin', 'chao hang', 'ban hang', 'tu tin', 'tim khach'],
      text: 'Bình thường, lúc đầu ai cũng ngại. Bạn sẽ có danh sách doanh nghiệp và mẫu tin nhắn soạn sẵn, không phải tự nghĩ từ đầu. Nhưng nói thẳng: chương trình yêu cầu bạn nhắn ít nhất 30 doanh nghiệp thật. Không nhắn thì không có khách.' },
    { id: 'plan', group: 'learn', label: '21 ngày cụ thể làm những gì?',
      keys: ['hoc gi', 'lam gi', 'lo trinh', 'noi dung', 'chuong trinh', 'hoc the nao', '21 ngay'],
      text: 'Bốn chặng, mỗi ngày một đầu ra. Ngày 1-6: chọn dịch vụ và dựng 1 landing mẫu. Ngày 7-12: làm hệ thống nhận khách gồm form, Zalo và báo giá. Ngày 13-17: tìm và nhắn 30 doanh nghiệp. Ngày 18-21: chốt, giao việc, lên kế hoạch 45 ngày tiếp theo.' },
    { id: 'service', group: 'learn', label: 'Mình sẽ bán dịch vụ gì cho khách?',
      keys: ['dich vu', 'ban gi', 'landing', 'landing page', 'portfolio', 'san pham'],
      text: 'Một gói cụ thể: landing page và form nhận khách cho doanh nghiệp nhỏ, có giá rõ ràng. Bạn dựng 1-2 mẫu thật cho ngách của mình làm portfolio, rồi mang mẫu đó đi chào khách.' },
    { id: 'support', group: 'learn', label: 'Bị kẹt giữa chừng thì ai hỗ trợ?',
      keys: ['ho tro', 'ket', 'bi loi', 'loi', 'hoi ai', 'review', 'mentor'],
      text: 'Mỗi nhiệm vụ có tiêu chí hoàn thành và SOP làm với AI. Cả lớp sinh hoạt trong một nhóm Zalo riêng, bị kẹt thì hỏi ngay trong nhóm. Ngoài ra có 4 buổi review nhóm (12/10, 18/10, 25/10, 01/11) để Tuấn Anh xem bài thật của bạn.' },
    { id: 'price', group: 'money', label: 'Học phí bao nhiêu, thanh toán thế nào?',
      keys: ['gia', 'gia bao nhieu', 'hoc phi', 'bao nhieu tien', 'chi phi', '990', 'tien', 're', 'dat qua', 'mac qua', 'thanh toan', 'coc', 'chuyen khoan', 'dang ky', 'tra gop'],
      text: 'Founding là 990.000đ, chỉ 3 suất, đợt sau là 2.490.000đ. Gửi form không mất phí. Nói chuyện xong, thấy hợp thì cọc 500.000đ giữ chỗ, trừ vào học phí. Nếu chương trình không đủ điều kiện mở thì mình hoàn cọc.' },
    { id: 'income', group: 'money', label: 'Học xong kiếm được bao nhiêu?',
      keys: ['kiem', 'thu nhap', 'kiem duoc', 'duoc bao nhieu', 'ket qua', 'khach tra tien', 'khach dau tien', 'tinh the nao', 'dau ra'],
      text: 'Mình không hứa thu nhập. Đích đến được đo là 1 khách trả tiền đầu tiên, bao nhiêu cũng được, trong 45 ngày kể từ 12/10. Phải có chuyển khoản hoặc xác nhận của khách mới tính.' },
    { id: 'refund', group: 'money', label: 'Có hoàn tiền không?',
      keys: ['hoan', 'hoan tien', 'refund', '50', 'tra lai', 'khong co khach', 'that bai', 'khong dat'],
      text: 'Hoàn 50% (495.000đ) nếu bạn nộp đủ 21 nhiệm vụ đúng hạn và có 1 khách trả tiền trong 45 ngày. Đổi lại bạn đồng ý cho chia sẻ câu chuyện của bạn, và được xem trước. Nếu không có khách thì không hoàn, nhưng bạn vẫn giữ gói dịch vụ, portfolio, danh sách khách và quy trình.' },
    { id: 'trust', group: 'money', label: 'Sao mình tin được chương trình này?',
      keys: ['tin', 'lua dao', 'uy tin', 'hoc vien', 'co ai hoc', 'chung minh', 'dam bao', 'ai day', 'tuan anh', 'nguoi day'],
      text: 'Bạn không cần tin trước. Tuấn Anh từng là lập trình viên, tự đi tìm khách freelance từ con số 0, gửi 180 email mới có người trả lời, giờ đang làm web và automation cho doanh nghiệp nhỏ. Bạn chỉ thanh toán sau khi hai bên nói chuyện và thấy hợp.' },
    { id: 'compare', group: 'money', label: 'Khác gì các khoá AI khác?',
      keys: ['khac gi', 'so sanh', 'khoa khac', 'khoa ai', 'chung chi', 'kp3'],
      text: 'Các khoá khác thường dạy AI rộng nhiều mảng, muốn khám phá thì đó là lựa chọn tốt. Ở đây hẹp hơn: một dịch vụ, một tệp khách, một đầu ra là khách trả tiền đầu tiên. Chứng chỉ chứng minh bạn đã học, còn ở đây thứ chứng minh là hoá đơn đầu tiên.' },
    { id: 'prep', group: 'after', label: 'Cần chuẩn bị gì?',
      keys: ['chuan bi', 'can gi', 'laptop', 'may tinh', 'tai khoan', 'domain', 'hosting'],
      text: 'Laptop, 2 giờ mỗi ngày, một tài khoản AI (bản miễn phí làm được phần lớn nhiệm vụ). Domain và hosting cho bản demo có thể tốn một khoản nhỏ.' },
    { id: 'after', group: 'after', label: 'Sau 21 ngày mình còn gì?',
      keys: ['sau 21 ngay', 'sau khi hoc', 'hoc xong', 'con gi', 'giu lai', 'tiep theo', 'sau do'],
      text: 'Bạn giữ lại 5 thứ: gói dịch vụ có giá, portfolio 1-2 mẫu thật, danh sách khách tiềm năng, bộ tin nhắn và báo giá, quy trình làm với AI để làm lại lần sau. Chặng cuối có kế hoạch 45 ngày tiếp theo để bạn đi tiếp.' }
  ];

  const THINK = { keys: ['nghi them', 'de sau', 'suy nghi', 'chua san sang', 'de xem', 'tinh sau'],
    text: 'Cứ nghĩ thêm, không vội. Muốn xem trước cách mình dùng AI trong công việc thật thì vào nhóm Zalo Digital Brain, miễn phí. Khi nào sẵn sàng thì form vẫn ở đây.' };
  const FALLBACK = 'Câu này mình chưa có sẵn câu trả lời. Bạn nhắn Tuấn Anh qua Zalo nhé.';

  const track = (name, data) => { try { window.va?.('event', { name, data }); } catch (_) { /* analytics không bắt buộc */ } };

  const normalize = (value) => ` ${value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const score = (text, keys) => keys.reduce((sum, key) => sum + (text.includes(` ${key} `) ? key.split(' ').length : 0), 0);

  const match = (raw) => {
    const text = normalize(raw);
    if (score(text, THINK.keys)) return { kind: 'think' };
    let best = null;
    let bestScore = 0;
    QUESTIONS.forEach((q) => {
      const s = score(text, q.keys);
      if (s > bestScore) { best = q; bestScore = s; }
    });
    return best ? { kind: 'question', question: best } : { kind: 'fallback' };
  };

  // Giao diện
  const root = document.createElement('div');
  root.className = 'chatbot';
  root.innerHTML = `
    <button class="chatbot-launcher" type="button" aria-expanded="false" aria-controls="chatbot-panel">
      <i class="bi bi-chat-dots" aria-hidden="true"></i><span>Hỏi nhanh</span>
    </button>
    <section class="chatbot-panel" id="chatbot-panel" role="dialog" aria-label="Trợ lý tư vấn 21AISYSTEM" hidden>
      <header class="chatbot-head">
        <div><strong>Trợ lý 21AISYSTEM</strong><span>Tự động, theo kịch bản soạn sẵn</span></div>
        <button class="chatbot-close" type="button" aria-label="Đóng trợ lý">&times;</button>
      </header>
      <div class="chatbot-log" role="log" aria-live="polite"></div>
      <form class="chatbot-input">
        <label class="visually-hidden" for="chatbot-text">Gõ câu hỏi</label>
        <input id="chatbot-text" type="text" autocomplete="off" maxlength="200" placeholder="Hoặc gõ câu hỏi của bạn">
        <button type="submit" aria-label="Gửi"><i class="bi bi-send" aria-hidden="true"></i></button>
      </form>
      <footer class="chatbot-foot">
        <button class="button button-small button-primary" type="button" data-chat-action="form">Đăng ký phỏng vấn</button>
        <a class="button button-small button-ghost" href="${zaloUrl}" target="_blank" rel="noopener noreferrer" data-chat-action="zalo">Nhắn Zalo</a>
      </footer>
    </section>`;
  document.body.appendChild(root);

  const launcher = root.querySelector('.chatbot-launcher');
  const panel = root.querySelector('.chatbot-panel');
  const log = root.querySelector('.chatbot-log');
  const form = root.querySelector('.chatbot-input');
  const input = form.querySelector('input');
  let started = false;

  const scrollDown = () => { log.scrollTop = log.scrollHeight; };

  const say = (text, who = 'bot') => {
    const bubble = document.createElement('p');
    bubble.className = `chatbot-msg chatbot-msg-${who}`;
    bubble.textContent = text;
    log.appendChild(bubble);
    scrollDown();
  };

  const offer = (options) => {
    log.querySelectorAll('.chatbot-options').forEach((el) => el.remove());
    const wrap = document.createElement('div');
    wrap.className = 'chatbot-options';
    options.forEach(({ label, run, href, action }) => {
      const el = document.createElement(href ? 'a' : 'button');
      el.className = 'chatbot-chip';
      el.textContent = label;
      if (href) {
        el.href = href;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.addEventListener('click', () => track(action, { from: 'chip' }));
      } else {
        el.type = 'button';
        el.addEventListener('click', () => { say(label, 'user'); run(); });
      }
      wrap.appendChild(el);
    });
    log.appendChild(wrap);
    scrollDown();
  };

  const openForm = () => {
    track('chat_to_form', {});
    close();
    const link = document.querySelector('[data-application-link]');
    if (link) link.click();
    else document.getElementById('dang-ky')?.scrollIntoView({ behavior: 'smooth' });
  };

  const groupChip = { label: 'Vào nhóm Digital Brain', href: GROUP_URL, action: 'chat_to_group' };
  const formChip = { label: 'Đăng ký phỏng vấn', run: openForm };

  const showGroup = (group) => offer([
    ...QUESTIONS.filter((q) => q.group === group.id).map((q) => ({ label: q.label, run: () => answer(q) })),
    { label: 'Nhóm câu hỏi khác', run: showMenu }
  ]);

  function showMenu() {
    offer(GROUPS.map((group) => ({ label: group.label, run: () => { track('chat_group', { id: group.id }); showGroup(group); } })));
  }

  const think = () => { track('chat_think', {}); say(THINK.text); offer([groupChip, formChip]); };

  function answer(q) {
    track('chat_question', { id: q.id });
    say(q.text);
    say(CLOSE);
    offer([formChip, { label: 'Hỏi câu khác', run: showMenu }, { label: 'Để mình nghĩ thêm', run: think }]);
  }

  const chooseRole = (role) => {
    track('chat_role', { id: role.id });
    say(role.text);
    if (role.id === 'owner') offer([{ label: 'Nhắn Zalo Tuấn Anh', href: zaloUrl, action: 'chat_owner_zalo' }, { label: 'Xem câu hay hỏi', run: showMenu }]);
    else showMenu();
  };

  const start = () => {
    started = true;
    say(GREETING);
    say('Bạn đang là:');
    offer(ROLES.map((role) => ({ label: role.label, run: () => chooseRole(role) })));
  };

  function open() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    if (!started) { track('chat_open', {}); start(); }
    if (window.matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
  }

  function close() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
    launcher.focus({ preventScroll: true });
  }

  launcher.addEventListener('click', () => (panel.hidden ? open() : close()));
  root.querySelector('.chatbot-close').addEventListener('click', close);
  root.querySelector('[data-chat-action="form"]').addEventListener('click', openForm);
  root.querySelector('[data-chat-action="zalo"]').addEventListener('click', () => track('chat_to_zalo', { from: 'footer' }));
  panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    say(text, 'user');
    const result = match(text);
    track('chat_typed', { matched: result.kind === 'question' ? result.question.id : result.kind });
    if (result.kind === 'question') answer(result.question);
    else if (result.kind === 'think') think();
    else {
      say(FALLBACK);
      offer([{ label: 'Nhắn Zalo', href: zaloUrl, action: 'chat_to_zalo' }, { label: 'Xem câu hay hỏi', run: showMenu }]);
    }
  });
})();
