/* Trợ lý tư vấn 21AISYSTEM: kịch bản cố định, nội dung lấy từ sales_script.md */
(() => {
  const GROUP_URL = 'https://zalo.me/g/bq4q5hq8kew3eoxlrmod';
  const zaloUrl = document.body.dataset.zaloUrl?.trim() || 'https://zalo.me/0868532538';

  const GREETING = 'Chào bạn. Mình là trợ lý tự động của 21AISYSTEM, trả lời theo kịch bản Tuấn Anh soạn sẵn. Câu nào khó quá thì mình chuyển bạn sang Zalo nói chuyện trực tiếp với Tuấn Anh.';
  const CLOSE = 'Nghe có vẻ hợp thì bước tiếp theo là form phỏng vấn 3 phút. Gửi form không mất phí, chỉ thanh toán khi hai bên thấy phù hợp. Founding chỉ có 3 suất.';

  const ROLES = [
    { id: 'student', label: 'Sinh viên hoặc mới ra trường', text: 'Đúng người chương trình dành cho. Ngành nào cũng được: ngành bạn học chính là ngách khách đầu tiên của bạn. Bạn muốn hỏi gì trước?' },
    { id: 'worker', label: 'Đã đi làm, muốn làm freelance', text: 'Chương trình thiết kế cho sinh viên sắp và mới ra trường. Nếu bạn chưa có khách freelance nào và dành được 2 giờ mỗi ngày, cứ điền form phỏng vấn, hai bên trao đổi xem có hợp không. Bạn muốn hỏi gì trước?' },
    { id: 'owner', label: 'Chủ doanh nghiệp', text: '21AISYSTEM dành cho sinh viên đi tìm khách freelance đầu tiên, nên chưa hợp với bạn lắm. Nếu bạn muốn tự dùng AI cho doanh nghiệp, nhóm Zalo Digital Brain có chia sẻ miễn phí, bạn vào đọc thử nhé.' },
    { id: 'browse', label: 'Mình xem thử thôi', text: 'Thoải mái. Đây là mấy câu mọi người hay hỏi nhất:' }
  ];

  const QUESTIONS = [
    { id: 'price', label: 'Học phí bao nhiêu?', keys: ['gia', 'hoc phi', 'bao nhieu tien', 'chi phi', '990', 'tien', 're', 'dat qua', 'mac qua'],
      text: 'Founding Cohort là 990.000đ, chỉ nhận 3 người. Giá Founding chỉ dành cho 3 suất đầu, đổi lại bạn góp ý thẳng để mình làm chương trình tốt hơn qua từng tuần. Đợt sau là 2.490.000đ.' },
    { id: 'fit', label: 'Học ngành khác, không biết code có theo được không?', keys: ['code', 'nganh', 'it', 'lap trinh', 'ky thuat', 'kinh te', 'du lich', 'y duoc', 'ngon ngu', 'su pham', 'marketing', 'khong biet', 'phu hop', 'hop khong', 'theo duoc'],
      text: 'Được, ngành nào cũng được. AI làm phần code, bạn cần dùng được máy tính và AI chat ở mức cơ bản. Phần còn lại là hiểu khách, mà cái đó ngành bạn học có sẵn: học du lịch thì làm cho homestay, y dược làm cho phòng khám, kinh tế làm cho cửa hàng, spa.' },
    { id: 'time', label: 'Mỗi ngày mất bao lâu, học thế nào?', keys: ['bao lau', 'thoi gian', 'may gio', 'moi ngay', 'lich', 'khi nao', 'bat dau', 'khai giang', 'online', 'truc tuyen', 'offline', 'hoc the nao'],
      text: '2 giờ mỗi ngày trong 21 ngày, học trực tuyến. Mỗi ngày một nhiệm vụ có tiêu chí hoàn thành. Có 4 buổi review nhóm: 12/10 khởi động, 18/10, 25/10 và Demo Day 01/11.' },
    { id: 'result', label: '"Khách trả tiền đầu tiên" tính thế nào?', keys: ['tinh the nao', 'khach tra tien', 'ket qua', 'khach dau tien', 'dau ra'],
      text: 'Là một doanh nghiệp hoặc cá nhân trả tiền cho dịch vụ bạn làm bằng AI, bao nhiêu cũng được, trong vòng 45 ngày kể từ 12/10. Phải có chuyển khoản hoặc xác nhận của khách.' },
    { id: 'fail', label: 'Nếu không có khách thì sao?', keys: ['khong co khach', 'that bai', 'khong ban duoc', 'khong dat', 'truot'],
      text: 'Bạn vẫn giữ gói dịch vụ, portfolio 1-2 mẫu, danh sách khách tiềm năng và quy trình làm với AI. Nhưng mình không hoàn tiền trường hợp này. Nói trước để bạn cân nhắc.' },
    { id: 'refund', label: 'Hoàn 50% thế nào?', keys: ['hoan', 'hoan tien', 'refund', '50', 'tra lai'],
      text: 'Hoàn 495.000đ nếu bạn nộp đủ 21 nhiệm vụ đúng hạn và có 1 khách trả tiền trong 45 ngày. Hoàn trong 7 ngày sau khi xác nhận. Đổi lại bạn đồng ý cho mình chia sẻ câu chuyện của bạn, và bạn được xem trước.' },
    { id: 'compare', label: 'Khác gì KP3 hay mấy khoá AI khác?', keys: ['kp3', 'khac gi', 'so sanh', 'khoa khac', 'agents', 'hoc vien ai', 'hoi dan it', 'chung chi'],
      text: 'Các chỗ khác dạy AI rộng hơn và cộng đồng lớn hơn, muốn khám phá nhiều mảng thì đó là lựa chọn tốt. Ở đây hẹp hơn: một dịch vụ, một tệp khách, một đầu ra là khách trả tiền đầu tiên. Chứng chỉ chứng minh bạn đã học, còn ở đây thứ chứng minh là hoá đơn đầu tiên.' },
    { id: 'trust', label: 'Sao mình tin được chương trình này?', keys: ['tin', 'lua dao', 'uy tin', 'hoc vien', 'co ai hoc', 'chung minh', 'dam bao', 'ai day', 'tuan anh', 'nguoi day'],
      text: 'Bạn không cần tin trước. Tuấn Anh từng là lập trình viên bị layoff, tự đi tìm khách freelance từ con số 0, gửi 180 email mới có người trả lời, và giờ đang làm web, automation cho doanh nghiệp nhỏ. Bạn chỉ thanh toán sau khi hai bên nói chuyện và thấy hợp, còn điều kiện hoàn 50% thì gắn với kết quả của chính bạn.' },
    { id: 'prep', label: 'Cần chuẩn bị gì?', keys: ['chuan bi', 'can gi', 'laptop', 'may tinh', 'tai khoan', 'domain', 'hosting'],
      text: 'Laptop, 2 giờ mỗi ngày, một tài khoản AI (bản miễn phí làm được phần lớn nhiệm vụ). Domain và hosting cho bản demo có thể tốn một khoản nhỏ.' },
    { id: 'pay', label: 'Thanh toán, đặt cọc thế nào?', keys: ['thanh toan', 'coc', 'chuyen khoan', 'dang ky', 'tra gop'],
      text: 'Điền form phỏng vấn không mất phí. Nói chuyện xong, thấy hợp thì cọc 500.000đ giữ chỗ, trừ vào học phí. Nếu chương trình không đủ điều kiện mở thì mình hoàn cọc.' }
  ];

  const THINK = { keys: ['nghi them', 'de sau', 'suy nghi', 'chua san sang', 'de xem', 'tinh sau'],
    text: 'Cứ nghĩ thêm, không vội. Nếu muốn xem trước cách mình dùng AI trong công việc thật, bạn vào nhóm Zalo Digital Brain, miễn phí. Khi nào sẵn sàng thì form vẫn ở đây.' };
  const FALLBACK = 'Câu này mình chưa có sẵn câu trả lời. Bạn nhắn Tuấn Anh qua Zalo nhé, bạn sẽ được trả lời trực tiếp.';

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

  const showMenu = () => offer(QUESTIONS.map((q) => ({ label: q.label, run: () => answer(q) })));

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
    if (role.id === 'owner') offer([groupChip, { label: 'Xem câu hay hỏi', run: showMenu }]);
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
