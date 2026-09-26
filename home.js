(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><';
  const randChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  // ---------- Smooth scroll (Lenis) ----------
  let lenis = null;
  const initLenis = () => {
    if (reducedMotion || typeof window.Lenis !== 'function') return;
    lenis = new window.Lenis();
    window.__lenis = lenis; // nav.js scrolls menu links through it
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  };

  // ---------- ScrambleIn: entrance reveal ----------
  const scrambleIn = (el, delay) => {
    const text = el.dataset.original;
    if (reducedMotion) { el.textContent = text; return; }
    setTimeout(() => {
      let frame = 0;
      const timer = setInterval(() => {
        const reveal = frame * 0.5;
        let out = '';
        for (let i = 0; i < text.length; i++) {
          if (text[i] === ' ') out += ' ';
          else if (i < reveal) out += text[i];
          else if (i < reveal + 3) out += randChar();
        }
        el.textContent = out;
        frame++;
        if (reveal >= text.length) { el.textContent = text; clearInterval(timer); }
      }, 25);
    }, delay);
  };

  // ---------- Hero video: mouse scrub ----------
  const initHeroScrub = () => {
    const video = document.getElementById('heroVideo');
    if (!video) return;
    const SENSITIVITY = 0.8;
    let target = 0;
    let seeking = false;
    let lastX = null;

    video.pause();
    // A paused video keeps its poster until the first seek; seek once the
    // first frame is decoded so the real video frame replaces the poster
    const showFirstFrame = () => { video.currentTime = 0.001; };
    if (video.readyState >= 2) showFirstFrame();
    else video.addEventListener('loadeddata', showFirstFrame, { once: true });

    // Chain seeks through `seeked` so rapid mouse moves never drop frames
    const seek = () => {
      if (seeking || !video.duration) return;
      if (Math.abs(video.currentTime - target) < 0.01) return;
      seeking = true;
      video.currentTime = target;
    };
    video.addEventListener('seeked', () => { seeking = false; seek(); });

    const move = (x) => {
      if (lastX === null) { lastX = x; return; }
      const dx = x - lastX;
      lastX = x;
      if (!video.duration) return;
      target = Math.min(video.duration, Math.max(0, target + (dx / window.innerWidth) * video.duration * SENSITIVITY));
      seek();
    };
    window.addEventListener('mousemove', (e) => move(e.clientX), { passive: true });
    window.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchend', () => { lastX = null; }, { passive: true });
  };

  // ---------- Cinematic 3D text driven by scroll + spring ----------
  const initCinematic = () => {
    const section = document.querySelector('[data-cinematic-section]');
    const text = document.getElementById('cinematicText');
    if (!section || !text) return;
    if (reducedMotion) {
      text.style.transform = 'none';
      text.style.opacity = '1';
      return;
    }

    // Mirrors framer-motion useSpring({ stiffness: 15, damping: 32, mass: 1.8 })
    const K = 15, C = 32, M = 1.8;
    let pos = 0, vel = 0, last = performance.now();

    // useScroll offset ["start end", "end start"]
    const progress = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      return Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    };
    pos = progress();

    const tick = (now) => {
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      const acc = (-K * (pos - progress()) - C * vel) / M;
      vel += acc * dt;
      pos += vel * dt;

      const y = 60 - 180 * pos;
      const opacity = Math.min(1, Math.max(0, (pos - 0.3) / 0.2));
      text.style.transform = `rotateX(24deg) translateY(${y.toFixed(2)}px) translateZ(15px)`;
      text.style.opacity = opacity.toFixed(3);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ---------- whileInView reveals ----------
  const initInView = () => {
    const items = document.querySelectorAll('.inview');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    items.forEach((el) => io.observe(el));
  };

  // ---------- Pause background videos while off-screen ----------
  const initVideoVisibility = () => {
    const videos = [...document.querySelectorAll('video[autoplay]')];
    const saveData = navigator.connection && navigator.connection.saveData;
    if (saveData) {
      videos.forEach((video) => video.pause());
      return;
    }

    const visibleVideos = new Set();
    const playVideo = (video) => {
      if (document.hidden) return;
      video.play().catch(() => {});
    };

    if (!('IntersectionObserver' in window)) {
      videos.forEach(playVideo);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          visibleVideos.add(target);
          playVideo(target);
        } else {
          visibleVideos.delete(target);
          target.pause();
        }
      });
    }, { threshold: 0.05 });
    videos.forEach((video) => io.observe(video));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        videos.forEach((video) => video.pause());
      } else {
        visibleVideos.forEach(playVideo);
      }
    });

    window.addEventListener('pageshow', () => visibleVideos.forEach(playVideo));
    document.addEventListener('pointerdown', () => visibleVideos.forEach(playVideo), { passive: true });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const scrambleEls = document.querySelectorAll('[data-scramble-in]');
    scrambleEls.forEach((el) => {
      el.dataset.original = el.textContent;
      el.innerHTML = '&nbsp;';
    });

    initLenis();
    initHeroScrub();
    initCinematic();
    initInView();
    initVideoVisibility();

    // Entrance: content fades in after 800ms, headings scramble in on their own delays
    setTimeout(() => {
      root.classList.add('entered');
      scrambleEls.forEach((el) => scrambleIn(el, Number(el.dataset.scrambleIn) || 0));
    }, reducedMotion ? 0 : 800);
  });
})();
