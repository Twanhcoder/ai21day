// Shared scroll effects for / and /course/: progress bar, staggered reveals,
// word-by-word headings, media parallax and count-up numbers.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Reduced motion keeps fades and counters; only movement (parallax, lift) is dropped
  if (!('IntersectionObserver' in window)) return;

  // Elements other scripts already animate or position
  // Content blocks wrapped in .reveal/.inview are still animated: their children stagger in
  const SKIP = '[data-scramble-in], [data-cinematic-text], #cinematicText, .cinematic-text, .course-cinematic-text, .scrolly-step, .scene-panel, dialog, [aria-hidden="true"]';
  const REVEAL = 'h3, p, li, article, figure, details, blockquote, .layer, .button, .cta-btn, .course-guide-quote';
  const COUNT = '.metric-value, .course-metrics-grid strong';

  const init = () => {
    const root = document.documentElement;
    const sections = [...document.querySelectorAll('main section')].slice(1); // hero keeps its own entrance

    // ---------- Progress bar ----------
    const bar = document.createElement('div');
    bar.className = 'fx-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    // ---------- Collect reveal targets ----------
    const words = [];
    const reveals = [];
    sections.forEach((section) => {
      section.querySelectorAll('h2').forEach((h) => {
        if (h.matches('.reveal, .inview') || h.closest(SKIP) || [...h.children].some((c) => c.tagName !== 'BR')) return;
        // Split text into word spans, keeping <br> line breaks
        const frag = document.createDocumentFragment();
        let i = 0;
        h.childNodes.forEach((node) => {
          if (node.nodeType !== Node.TEXT_NODE) { frag.appendChild(node.cloneNode()); return; }
          node.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'fx-word';
            w.style.setProperty('--fx-i', i++);
            w.textContent = part;
            frag.appendChild(w);
          });
        });
        h.setAttribute('aria-label', h.textContent.trim());
        h.replaceChildren(frag);
        h.classList.add('fx-words');
        words.push(h);
      });

      section.querySelectorAll(REVEAL).forEach((el) => {
        if (el.matches('.reveal, .inview') || el.closest(SKIP) || el.closest('.fx-reveal, .fx-words')) return;
        el.classList.add('fx-reveal');
        reveals.push(el);
      });
    });

    root.classList.add('fx-ready');

    const io = new IntersectionObserver((entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry, index) => {
          entry.target.style.setProperty('--fx-d', `${Math.min(index * 80, 480)}ms`);
          entry.target.classList.add('fx-in');
          io.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    [...words, ...reveals].forEach((el) => io.observe(el));

    // ---------- Count-up numbers ----------
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        countIO.unobserve(target);
        const text = target.textContent.trim();
        const end = Number(text);
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / 1400);
          const eased = 1 - Math.pow(1 - t, 3);
          target.textContent = String(Math.round(end * eased)).padStart(text.length, '0');
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(COUNT).forEach((el) => {
      if (/^\d+$/.test(el.textContent.trim())) countIO.observe(el);
    });

    // ---------- Parallax media ----------
    const media = reducedMotion ? [] : [...document.querySelectorAll('main section video, main section [class*="media"] img')]
      .filter((el) => !el.closest('.scrolly-visual'))
      .map((el) => {
        const host = el.closest('section');
        host.classList.add('fx-clip');
        el.classList.add('fx-parallax');
        return { el, host };
      });

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      media.forEach(({ el, host }) => {
        const rect = host.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const p = (vh - rect.top) / (vh + rect.height); // 0 entering, 1 leaving
        el.style.setProperty('--fx-y', `${((p - 0.5) * -90).toFixed(1)}px`);
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
