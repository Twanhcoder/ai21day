document.addEventListener('DOMContentLoaded', () => {
  const revealItems = document.querySelectorAll('.reveal');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion && 'IntersectionObserver' in window) {
    try {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      revealItems.forEach((item) => revealObserver.observe(item));
      document.documentElement.classList.add('motion-ready');
    } catch (error) {
      document.documentElement.classList.remove('motion-ready');
      revealItems.forEach((item) => item.classList.add('is-visible'));
    }
  }

  const scrollyStory = document.querySelector('[data-scrolly]');
  const scrollyViewport = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
  let scrollyObserver;

  const setActiveScene = (step, animate = true) => {
    if (!scrollyStory || !step) return;

    const visual = scrollyStory.querySelector('[data-scrolly-visual]');
    const panel = scrollyStory.querySelector('.scene-panel');
    const label = scrollyStory.querySelector('[data-scene-label]');
    const title = scrollyStory.querySelector('[data-scene-title]');
    const detail = scrollyStory.querySelector('[data-scene-detail]');
    const steps = scrollyStory.querySelectorAll('.scrolly-step');
    const markers = scrollyStory.querySelectorAll('[data-scene-marker]');
    const sceneId = step.dataset.scene;

    steps.forEach((item) => item.classList.toggle('is-active', item === step));
    markers.forEach((marker) => marker.classList.toggle('is-active', marker.dataset.sceneMarker === sceneId));

    if (visual) visual.dataset.activeScene = sceneId;
    if (label) label.textContent = step.dataset.label || '';
    if (title) title.textContent = step.dataset.title || '';
    if (detail) detail.textContent = step.dataset.detail || '';

    if (animate && panel?.animate) {
      panel.animate([
        { opacity: 0.35, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 280, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    }
  };

  const configureScrolly = () => {
    scrollyObserver?.disconnect();
    scrollyObserver = undefined;

    if (!scrollyStory) return;
    scrollyStory.classList.remove('is-enhanced');

    const steps = [...scrollyStory.querySelectorAll('.scrolly-step')];
    setActiveScene(steps[0], false);

    if (!scrollyViewport.matches || !('IntersectionObserver' in window)) return;

    try {
      scrollyObserver = new IntersectionObserver((entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * 0.45) - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.45))[0];

        if (activeEntry) setActiveScene(activeEntry.target);
      }, { rootMargin: '-38% 0px -44% 0px', threshold: 0 });

      steps.forEach((step) => scrollyObserver.observe(step));
      scrollyStory.classList.add('is-enhanced');
    } catch (error) {
      scrollyStory.classList.remove('is-enhanced');
      scrollyObserver?.disconnect();
    }
  };

  configureScrolly();
  scrollyViewport.addEventListener?.('change', configureScrolly);
  window.addEventListener('pagehide', () => scrollyObserver?.disconnect(), { once: true });

  const applicationUrl = document.body.dataset.applicationUrl?.trim();
  const formEmbedUrl = document.body.dataset.formEmbedUrl?.trim();
  const zaloUrl = document.body.dataset.zaloUrl?.trim();
  const applicationLinks = document.querySelectorAll('[data-application-link]');
  const applicationStatus = document.getElementById('application-status');
  const applicationDialog = document.getElementById('application-dialog');
  const applicationFrame = document.getElementById('application-frame');
  const canUseDialog = Boolean(formEmbedUrl && applicationFrame && applicationDialog?.showModal);

  const openApplicationDialog = () => {
    if (!applicationFrame.getAttribute('src')) applicationFrame.src = formEmbedUrl;
    applicationDialog.showModal();
  };

  if (canUseDialog) {
    applicationDialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => applicationDialog.close());
    applicationDialog.addEventListener('click', (event) => {
      if (event.target === applicationDialog) applicationDialog.close();
    });
  }

  applicationLinks.forEach((link) => {
    const liveFormUrl = applicationUrl || formEmbedUrl;

    if (canUseDialog) {
      link.href = liveFormUrl;
      link.textContent = 'Mở form đăng ký 3 phút';
      link.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        openApplicationDialog();
      });
      return;
    }

    if (liveFormUrl) {
      link.href = liveFormUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Mở form đăng ký 3 phút';
      return;
    }

    if (zaloUrl) {
      link.href = zaloUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Nhận form đăng ký qua Zalo';
      return;
    }

    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (!applicationStatus) return;
      applicationStatus.textContent = 'Form đăng ký chưa được gắn. Điền URL vào data-application-url hoặc data-form-embed-url trong index.html trước khi xuất bản.';
      applicationStatus.focus?.();
    });
  });

  const mobileCta = document.getElementById('mobileCta');
  const hero = document.getElementById('hero');
  const offer = document.getElementById('dang-ky');

  if (mobileCta && hero && offer && 'IntersectionObserver' in window) {
    let heroPassed = false;
    let offerVisible = false;
    let offerPassed = false;

    const updateMobileCta = () => {
      const visible = heroPassed && !offerVisible && !offerPassed;
      mobileCta.classList.toggle('is-visible', visible);
      mobileCta.setAttribute('aria-hidden', visible ? 'false' : 'true');
      mobileCta.toggleAttribute('inert', !visible);
    };

    const heroObserver = new IntersectionObserver(([entry]) => {
      heroPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      updateMobileCta();
    }, { threshold: 0 });

    const offerObserver = new IntersectionObserver(([entry]) => {
      offerVisible = entry.isIntersecting;
      offerPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      updateMobileCta();
    }, { threshold: 0.12 });

    heroObserver.observe(hero);
    offerObserver.observe(offer);
  }

  const faqItems = document.querySelectorAll('.faq-list details');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) otherItem.open = false;
      });
    });
  });
});
