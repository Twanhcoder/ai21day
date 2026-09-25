// Shared navbar behaviour for / and /course/: expanding menu pill + hover scramble.
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><';
  const randChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  // ---------- ScrambleText: hover scramble ----------
  const initHoverScramble = () => {
    document.querySelectorAll('.hover-scramble').forEach((trigger) => {
      const el = trigger.querySelector('[data-scramble-text]');
      if (!el) return;
      const text = el.textContent;
      let timer = null;
      const reset = () => { clearInterval(timer); timer = null; el.textContent = text; };
      const start = () => {
        if (reducedMotion) return;
        reset();
        let frame = 0;
        timer = setInterval(() => {
          const revealed = Math.floor(frame / 4);
          let out = '';
          for (let i = 0; i < text.length; i++) {
            out += text[i] === ' ' || i < revealed ? text[i] : randChar();
          }
          el.textContent = out;
          frame++;
          if (revealed >= text.length) reset();
        }, 25);
      };
      trigger.addEventListener('mouseenter', start);
      trigger.addEventListener('focus', start);
      trigger.addEventListener('mouseleave', reset);
      trigger.addEventListener('blur', reset);
    });
  };

  // ---------- Expanding menu pill ----------
  const initMenu = () => {
    const btn = document.getElementById('burgerBtn');
    if (!btn) return;
    const setOpen = (open) => {
      root.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    };
    btn.addEventListener('click', () => setOpen(!root.classList.contains('menu-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

    document.querySelectorAll('.nav-links a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = document.getElementById(link.getAttribute('href').slice(1));
        if (!target) return;
        // Home drives scrolling through Lenis; other pages use native smooth scroll + scroll-padding
        if (window.__lenis) {
          e.preventDefault();
          window.__lenis.scrollTo(target);
        }
        if (window.innerWidth < 640) setOpen(false);
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initHoverScramble();
    initMenu();
  });
})();
