// ========== 3D CURSOR (REACTS TO HOVER AREAS) ==========
(function() {
  const cursor = document.getElementById('cursor3d');
  if (!cursor) return;

  const ENABLE_CUSTOM_CURSOR = false;
  if (!ENABLE_CUSTOM_CURSOR) {
    cursor.style.display = 'none';
    return;
  }

  // Disable on touch devices — keep native cursor
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    cursor.style.display = 'none';
    return;
  }

  // Only hide native cursor once the 3D cursor is running
  document.body.classList.add('cursor-active');

  const inner = cursor.querySelector('.cursor-3d-inner');
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let rotateX = 0, rotateY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const HOVER_SELECTOR =
    'a, button, [tabindex], .contact-chip, .btn, .nav-links a, .project-link, ' +
    '.recognition-gallery figure, .showcase-shot, .skill-item, .hero-ai-tool, ' +
    '.image-lightbox, .lightbox-close, .lightbox-nav, .stat-card, .education-list li';

  function findHoverTarget(el) {
    return el && el.closest ? el.closest(HOVER_SELECTOR) : null;
  }

  function computeTiltToward(target) {
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (cx - mouseX) / Math.max(rect.width, 120);
    const dy = (cy - mouseY) / Math.max(rect.height, 120);
    targetTiltY = Math.max(-25, Math.min(25, dx * 25));
    targetTiltX = Math.max(-25, Math.min(25, -dy * 25));
  }

  document.addEventListener('mouseover', (e) => {
    const target = findHoverTarget(e.target);
    if (target) {
      cursor.classList.add('hovering');
      computeTiltToward(target);
    }
  });

  document.addEventListener('mouseout', (e) => {
    const from = findHoverTarget(e.target);
    const to = e.relatedTarget ? findHoverTarget(e.relatedTarget) : null;
    if (from && !to) {
      cursor.classList.remove('hovering');
      targetTiltX = 0;
      targetTiltY = 0;
    }
  });

  function animate() {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;

    const vx = mouseX - cursorX;
    const vy = mouseY - cursorY;
    const moveTiltX = Math.max(-25, Math.min(25, -vy * 1.1));
    const moveTiltY = Math.max(-25, Math.min(25, vx * 1.1));

    rotateX += ((moveTiltX + targetTiltX) - rotateX) * 0.14;
    rotateY += ((moveTiltY + targetTiltY) - rotateY) * 0.14;

    cursor.style.transform = `translate3d(${cursorX - 20}px, ${cursorY - 20}px, 0)`;
    if (inner) {
      inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
    requestAnimationFrame(animate);
  }

  cursorX = window.innerWidth / 2;
  cursorY = window.innerHeight / 2;
  animate();

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
})();

// ========== NAV TOGGLE ==========
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ========== TYPEWRITER ==========
(function() {
  const heroTypeEl = document.querySelector('.hero-typewriter');
  if (heroTypeEl) {
    const heroText = ' I am Yuri Neil Bayron';
    let heroIndex = 0;
    let heroDeleting = false;

    function typeHero() {
      heroTypeEl.textContent = heroText.slice(0, heroIndex);

      if (!heroDeleting && heroIndex < heroText.length) {
        heroIndex++;
        setTimeout(typeHero, 70 + Math.random() * 40);
      } else if (!heroDeleting && heroIndex === heroText.length) {
        heroDeleting = true;
        setTimeout(typeHero, 2000);
      } else if (heroDeleting && heroIndex > 0) {
        heroIndex--;
        setTimeout(typeHero, 35);
      } else if (heroDeleting && heroIndex === 0) {
        heroDeleting = false;
        setTimeout(typeHero, 500);
      }
    }
    setTimeout(() => { heroIndex = 0; typeHero(); }, 400);
  }

  const sectionTypeEl = document.querySelector('.section-typewriter');
  if (sectionTypeEl) {
    const sectionText = sectionTypeEl.getAttribute('aria-label') || '';
    if (!sectionText) return;

    let sectionIndex = 0;
    let sectionDeleting = false;

    function typeSection() {
      sectionTypeEl.textContent = sectionText.slice(0, sectionIndex);

      if (!sectionDeleting && sectionIndex < sectionText.length) {
        sectionIndex++;
        setTimeout(typeSection, 55 + Math.random() * 30);
      } else if (!sectionDeleting && sectionIndex === sectionText.length) {
        sectionDeleting = true;
        setTimeout(typeSection, 3200);
      } else if (sectionDeleting && sectionIndex > 0) {
        sectionIndex--;
        setTimeout(typeSection, 28);
      } else if (sectionDeleting && sectionIndex === 0) {
        sectionDeleting = false;
        setTimeout(typeSection, 800);
      }
    }

    setTimeout(() => { sectionIndex = 0; typeSection(); }, 800);
  }
})();

// ========== SCROLL REVEAL ==========
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  const revealElements = document.querySelectorAll(
    '.surface-card, .recognition-card, .highlight-panel, .contact-chip, ' +
    '.hero-ai-tool, .stat-card, .education-list li, .project-card, .skills-panel, .skill-item'
  );

  revealElements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.5s ease ${Math.min(i * 0.03, 0.5)}s, transform 0.5s ease ${Math.min(i * 0.03, 0.5)}s`;
    observer.observe(el);
  });
})();

// ========== SMOOTH ANCHOR SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ========== PROJECT IMAGE CAROUSELS ==========
(function() {
  document.querySelectorAll('.project-showcase').forEach(showcase => {
    const shots = Array.from(showcase.querySelectorAll('.showcase-shot'));
    if (shots.length < 2) return;

    const prevBtn = showcase.querySelector('.project-gallery-prev');
    const nextBtn = showcase.querySelector('.project-gallery-next');
    let currentIndex = shots.findIndex(shot => shot.classList.contains('is-active'));
    if (currentIndex < 0) currentIndex = 0;

    function showShot(index) {
      currentIndex = (index + shots.length) % shots.length;
      shots.forEach((shot, shotIndex) => {
        const isActive = shotIndex === currentIndex;
        shot.classList.toggle('is-active', isActive);
        shot.setAttribute('aria-hidden', String(!isActive));
      });
    }

    showShot(currentIndex);
    prevBtn?.addEventListener('click', () => showShot(currentIndex - 1));
    nextBtn?.addEventListener('click', () => showShot(currentIndex + 1));
  });
})();

// ========== LIGHTBOX (Projects page) ==========
(function() {
  const lightbox = document.getElementById('imageLightbox');
  if (!lightbox) return;

  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  let currentGroup = [];
  let currentIndex = 0;

  function gatherGroup(shot) {
    const showcase = shot.closest('.project-showcase');
    if (!showcase) return [shot];
    return Array.from(showcase.querySelectorAll('.showcase-shot'));
  }

  function showImage(index) {
    if (!currentGroup.length) return;
    currentIndex = (index + currentGroup.length) % currentGroup.length;
    const shot = currentGroup[currentIndex];
    const img = shot.querySelector('img');
    if (img) {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      lightboxCaption.textContent = img.alt || '';
    }
  }

  closeBtn?.addEventListener('click', () => lightbox.close());
  prevBtn?.addEventListener('click', () => showImage(currentIndex - 1));
  nextBtn?.addEventListener('click', () => showImage(currentIndex + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.open) return;
    if (e.key === 'Escape') lightbox.close();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });
})();