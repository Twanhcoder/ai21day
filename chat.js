/* Trợ lý tư vấn 21AISYSTEM: trả lời bằng agent AI (GoClaw) qua /api/chat. Kiến thức của agent lấy từ sales_script.md. */
(() => {
  const GROUP_URL = 'https://zalo.me/g/bq4q5hq8kew3eoxlrmod';
  const zaloUrl = document.body.dataset.zaloUrl?.trim() || 'https://zalo.me/0868532538';

  const GREETING = 'Chào bạn, mình là trợ lý AI của 21AISYSTEM. Bạn cứ hỏi về chương trình, học phí hay việc mình có hợp không. Câu nào mình chưa chắc, mình chuyển bạn sang Zalo gặp Tuấn Anh luôn.';
  const ERROR_TEXT = 'Mình đang gặp trục trặc nên chưa trả lời được. Bạn nhắn Tuấn Anh qua Zalo giúp mình nhé.';

  // Gợi ý câu hỏi để bắt đầu nhanh; câu trả lời do agent tạo.
  const SUGGESTIONS = [
    'Mình học ngành không liên quan IT, có theo được không?',
    'Mình chưa biết code thì sao?',
    'Chương trình có cam kết có khách trong 21 ngày không?',
    '21 ngày cụ thể làm những gì?',
    'Học phí bao nhiêu, thanh toán thế nào?',
    'Có hoàn học phí không?'
  ];

  const track = (name, data) => { try { window.va?.('event', { name, data }); } catch (_) { /* analytics không bắt buộc */ } };

  // Mã phiên ẩn danh để agent nhớ ngữ cảnh khi khách hỏi tiếp; không chứa thông tin cá nhân.
  const SESSION_KEY = 'chatbot-session';
  const newSession = () => (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
  const session = (() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved && /^[a-z0-9-]{8,64}$/.test(saved)) return saved;
      const id = newSession();
      localStorage.setItem(SESSION_KEY, id);
      return id;
    } catch (_) {
      return newSession(); // trình duyệt chặn storage: dùng phiên tạm
    }
  })();

  // Giao diện
  const root = document.createElement('div');
  root.className = 'chatbot';
  root.innerHTML = `
    <button class="chatbot-launcher" type="button" aria-expanded="false" aria-controls="chatbot-panel">
      <i class="bi bi-chat-dots" aria-hidden="true"></i><span>Hỏi nhanh</span>
    </button>
    <section class="chatbot-panel" id="chatbot-panel" role="dialog" aria-label="Trợ lý tư vấn 21AISYSTEM" hidden>
      <header class="chatbot-head">
        <div><strong>Trợ lý 21AISYSTEM</strong><span>Trợ lý AI, có thể nhầm. Câu quan trọng hãy hỏi Tuấn Anh</span></div>
        <button class="chatbot-close" type="button" aria-label="Đóng trợ lý">&times;</button>
      </header>
      <div class="chatbot-log" role="log" aria-live="polite"></div>
      <form class="chatbot-input">
        <label class="visually-hidden" for="chatbot-text">Gõ câu hỏi</label>
        <input id="chatbot-text" type="text" autocomplete="off" maxlength="300" placeholder="Gõ câu hỏi của bạn">
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
  const sendButton = form.querySelector('button');
  let started = false;
  let busy = false;

  const scrollDown = () => { log.scrollTop = log.scrollHeight; };

  const say = (text, who = 'bot') => {
    const bubble = document.createElement('p');
    bubble.className = `chatbot-msg chatbot-msg-${who}`;
    bubble.textContent = text;
    log.appendChild(bubble);
    scrollDown();
    return bubble;
  };

  const clearOptions = () => log.querySelectorAll('.chatbot-options').forEach((el) => el.remove());

  const offer = (options) => {
    clearOptions();
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
        el.addEventListener('click', run);
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

  const zaloChip = { label: 'Nhắn Zalo Tuấn Anh', href: zaloUrl, action: 'chat_to_zalo' };

  const setBusy = (value) => {
    busy = value;
    input.disabled = value;
    sendButton.disabled = value;
  };

  async function ask(text, from) {
    if (busy) return;
    clearOptions();
    say(text, 'user');
    track('chat_ask', { from });
    setBusy(true);
    const typing = say('Đang trả lời…', 'bot');
    typing.classList.add('chatbot-typing');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session })
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      if (!res.ok || !data.reply) {
        track('chat_error', { status: res.status });
        say(data.error || ERROR_TEXT);
        offer([zaloChip, { label: 'Vào nhóm Digital Brain', href: GROUP_URL, action: 'chat_to_group' }]);
        return;
      }
      say(data.reply);
      offerSuggestions();
    } catch (_) {
      typing.remove();
      track('chat_error', { status: 0 });
      say(ERROR_TEXT);
      offer([zaloChip]);
    } finally {
      setBusy(false);
      if (window.matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
    }
  }

  // Hiện lại các câu gợi ý khách chưa bấm, để họ hỏi tiếp mà không phải gõ.
  const asked = new Set();
  function offerSuggestions() {
    const rest = SUGGESTIONS.filter((label) => !asked.has(label));
    if (!rest.length) return;
    offer(rest.map((label) => ({ label, run: () => { asked.add(label); ask(label, 'chip'); } })));
  }

  const start = () => {
    started = true;
    say(GREETING);
    offerSuggestions();
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
    if (!text || busy) return;
    input.value = '';
    ask(text, 'typed');
  });
})();
