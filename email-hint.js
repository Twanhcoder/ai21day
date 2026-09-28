// Gợi ý sửa email gõ nhầm tên miền (gmail.con, gmial.com...). Chỉ gợi ý, không chặn gửi form.
(() => {
  const DOMAINS = ['gmail.com', 'yahoo.com', 'yahoo.com.vn', 'hotmail.com', 'outlook.com', 'icloud.com'];

  const distance = (a, b) => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  };

  const suggest = (email) => {
    const at = email.lastIndexOf('@');
    if (at < 1) return null;
    const domain = email.slice(at + 1).toLowerCase();
    if (!domain || DOMAINS.includes(domain)) return null;
    let best = null;
    let bestScore = 3; // chỉ gợi ý khi lệch tối đa 2 ký tự
    for (const d of DOMAINS) {
      const score = distance(domain, d);
      if (score < bestScore) { best = d; bestScore = score; }
    }
    return best ? `${email.slice(0, at)}@${best}` : null;
  };

  document.querySelectorAll('input[type="email"]').forEach((input) => {
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'f-hint';
    hint.hidden = true;
    (input.closest('.f-field') || input.parentElement).appendChild(hint);

    const update = () => {
      const fix = suggest(input.value.trim());
      hint.hidden = !fix;
      if (fix) {
        hint.dataset.fix = fix;
        hint.textContent = `Có phải bạn định nhập ${fix}? Bấm để sửa.`;
      }
    };

    input.addEventListener('blur', update);
    input.addEventListener('input', () => { if (!hint.hidden) update(); });
    hint.addEventListener('click', () => {
      input.value = hint.dataset.fix;
      hint.hidden = true;
      input.dispatchEvent(new Event('blur'));
      input.focus();
    });
  });
})();
