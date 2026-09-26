(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Phones and tablets: no hover, touch-driven scrolling and a weaker GPU
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isSmall = window.matchMedia('(max-width: 767px)').matches;
  // Small screens get the lighter portrait/720p encodes
  const videoSrc = (video) => (isSmall && video.dataset.srcMobile) || video.dataset.src;
  const loadVideo = (video) => {
    if (video.getAttribute('src') || !video.dataset.src) return;
    video.src = videoSrc(video);
  };
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><';
  const randChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  // ---------- Smooth scroll (Lenis) ----------
  let lenis = null;
  const initLenis = () => {
    // Lenis never smooths touch scrolling, so on phones it would only burn a rAF loop
    if (reducedMotion || isTouch || typeof window.Lenis !== 'function') return;
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
    // Touch: seeking on every touchmove stutters while scrolling, so just loop the clip
    // (initVideoVisibility plays/pauses it like the other background videos)
    if (isTouch) {
      video.loop = true;
      video.autoplay = true;
      // iOS paints nothing for a video that hasn't started (Low Power Mode blocks autoplay),
      // so keep it hidden over the poster background until it really plays
      video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
      return;
    }
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

    // Near critically damped spring: follows scroll in ~0.4s instead of the old ~2s lag
    const K = 120, C = 22, M = 1;
    let pos = 0, vel = 0, last = performance.now();

    // useScroll offset ["start end", "end start"]
    const progress = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      return Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    };
    pos = progress();

    // Only animate while the section is near the viewport and the spring is still moving
    let visible = false, running = false;
    const tick = (now) => {
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      const goal = progress();
      const acc = (-K * (pos - goal) - C * vel) / M;
      vel += acc * dt;
      pos += vel * dt;

      const y = 60 - 180 * pos;
      // Fully visible once the section's top reaches mid-screen, not when it is half scrolled past
      const opacity = Math.min(1, Math.max(0, (pos - 0.05) / 0.2));
      text.style.transform = `rotateX(24deg) translateY(${y.toFixed(2)}px) translateZ(15px)`;
      text.style.opacity = opacity.toFixed(3);

      if (!visible || (Math.abs(goal - pos) < 0.0005 && Math.abs(vel) < 0.0005)) { running = false; return; }
      requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || !visible) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    }, { rootMargin: '20% 0px' }).observe(section);
    window.addEventListener('scroll', start, { passive: true });
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
    // Runs after initHeroScrub, so the hero joins this list on touch devices
    const videos = [...document.querySelectorAll('video[autoplay]')];
    const saveData = navigator.connection && navigator.connection.saveData;
    if (saveData) {
      videos.forEach((video) => video.pause());
      return;
    }

    const visibleVideos = new Set();
    const playVideo = (video) => {
      if (document.hidden) return;
      loadVideo(video);
      video.play().catch(() => {});
    };

    if (!('IntersectionObserver' in window)) {
      videos.forEach(playVideo);
      return;
    }

    // Start downloading a screen before a video scrolls into view, not on page load
    const preload = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        loadVideo(target);
        preload.unobserve(target);
      });
    }, { rootMargin: '100% 0px' });
    videos.forEach((video) => preload.observe(video));

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
