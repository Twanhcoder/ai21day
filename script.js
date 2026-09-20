/**
 * AI VÀO VIỆC 21 - JavaScript
 * Xử lý tương tác accordion FAQ, thanh CTA di động và cuộn trang mượt mà
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. XỬ LÝ ACCORDION CHO FAQ
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Đóng tất cả các câu hỏi khác
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          const otherBtn = otherItem.querySelector('.faq-question');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          otherBtn.setAttribute('aria-expanded', 'false');
          otherAnswer.style.maxHeight = null;
        }
      });

      // Bật/tắt câu hỏi hiện tại
      if (!isActive) {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 40 + 'px';
      } else {
        item.classList.remove('active');
        questionBtn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = null;
      }
    });
  });

  // Mặc định mở câu hỏi đầu tiên để người đọc dễ thấy
  if (faqItems.length > 0) {
    const firstItem = faqItems[0];
    firstItem.classList.add('active');
    const firstBtn = firstItem.querySelector('.faq-question');
    const firstAnswer = firstItem.querySelector('.faq-answer');
    firstBtn.setAttribute('aria-expanded', 'true');
    firstAnswer.style.maxHeight = firstAnswer.scrollHeight + 40 + 'px';
  }

  // 2. XỬ LÝ THANH CTA CỐ ĐỊNH Ở ĐÁY MÀN HÌNH DI ĐỘNG
  const mobileStickyCta = document.getElementById('mobileStickyCta');
  const heroSection = document.getElementById('hero');
  const finalCtaSection = document.getElementById('dang-ky');

  if (mobileStickyCta && heroSection && finalCtaSection) {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      const finalCtaTop = finalCtaSection.offsetTop - window.innerHeight + 100;

      // Hiện thanh CTA khi cuộn qua Hero và chưa tới khu vực đăng ký cuối trang
      if (scrollY > heroBottom && scrollY < finalCtaTop) {
        mobileStickyCta.classList.add('visible');
      } else {
        mobileStickyCta.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 3. XỬ LÝ CUỘN MƯỢT CHO CÁC LIÊN KẾT NEO (#)
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  const header = document.querySelector('.site-header');
  const headerHeight = header ? header.offsetHeight : 0;

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 12;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // 4. XỬ LÝ NÚT LIÊN KẾT PLACEHOLDER
  const placeholderLinks = document.querySelectorAll('a[href*="[LINK"]');
  placeholderLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('[') && href.endsWith(']')) {
        e.preventDefault();
        alert(`Bạn đang bấm vào liên kết placeholder: ${href}\n\nSau khi bạn tạo link Google Form / Zalo thực tế, bạn chỉ cần thay giá trị này trong file index.html!`);
      }
    });
  });

  // 5. XỬ LÝ CHUYỂN ĐỔI TAB 3 ĐỒNG ĐỘI AI TRONG HERO INTERACTIVE DECK
  const agentTabBtns = document.querySelectorAll('.agent-tab-btn');
  const agentTabContents = document.querySelectorAll('.agent-tab-content');

  agentTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetAgent = btn.getAttribute('data-agent');

      agentTabBtns.forEach(b => b.classList.remove('active'));
      agentTabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetAgent);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
});
