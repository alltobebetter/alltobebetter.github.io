(() => {
  const container = document.getElementById('fullpage');
  const sections = container.querySelectorAll('.section');
  const total = sections.length;
  const scrollHint = document.querySelector('.scroll-hint');
  let current = 0;
  let isAnimating = false;
  const COOLDOWN = 900;

  const sectionIds = Array.from(sections).map(s => s.id || '');

  // Active nav highlight
  const navAnchors = document.querySelectorAll('.nav__anchor');
  function updateActiveNav() {
    navAnchors.forEach(a => {
      const idx = parseInt(a.dataset.goto, 10);
      a.classList.toggle('is-active', idx === current);
    });
  }

  function goTo(index) {
    if (index < 0 || index >= total || index === current || isAnimating) return;
    isAnimating = true;
    current = index;
    container.style.transform = `translateY(-${current * 100}vh)`;
    if (scrollHint) scrollHint.classList.toggle('is-hidden', current !== 0);
    updateActiveNav();
    if (sectionIds[current]) {
      history.replaceState(null, '', '#' + sectionIds[current]);
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
    setTimeout(() => { isAnimating = false; }, COOLDOWN);
  }

  // Check if an inner scrollable element should consume the scroll
  function innerCanScroll(direction) {
    const section = sections[current];
    const scrollable = section.querySelector('[data-inner-scroll]');
    if (!scrollable) return false;

    if (direction > 0) {
      // scrolling down — can the inner element still scroll down?
      return scrollable.scrollTop + scrollable.clientHeight < scrollable.scrollHeight - 2;
    } else {
      // scrolling up — can the inner element still scroll up?
      return scrollable.scrollTop > 2;
    }
  }

  // Wheel
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isAnimating) return;
    const dir = e.deltaY > 0 ? 1 : -1;

    if (innerCanScroll(dir)) {
      // Manually scroll the inner element since we preventDefault on wheel
      const scrollable = sections[current].querySelector('[data-inner-scroll]');
      scrollable.scrollBy({ top: e.deltaY, behavior: 'smooth' });
      return;
    }

    if (dir > 0) goTo(current + 1);
    else goTo(current - 1);
  }, { passive: false });

  // Touch
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (isAnimating) return;
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) < 40) return;
    const dir = diff > 0 ? 1 : -1;
    if (innerCanScroll(dir)) return;
    if (dir > 0) goTo(current + 1);
    else goTo(current - 1);
  }, { passive: true });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (isAnimating) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      if (innerCanScroll(1)) return;
      e.preventDefault();
      goTo(current + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      if (innerCanScroll(-1)) return;
      e.preventDefault();
      goTo(current - 1);
    }
  });

  // Nav links
  document.querySelectorAll('[data-goto]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(parseInt(link.dataset.goto, 10));
    });
  });

  // Init from hash
  const initHash = window.location.hash.replace('#', '');
  if (initHash) {
    const idx = sectionIds.indexOf(initHash);
    if (idx > 0) {
      current = idx;
      container.style.transition = 'none';
      container.style.transform = `translateY(-${current * 100}vh)`;
      if (scrollHint) scrollHint.classList.toggle('is-hidden', current !== 0);
      updateActiveNav();
      requestAnimationFrame(() => {
        container.style.transition = '';
      });
    }
  }

  // Modals
  function setupModal(name) {
    const modal = document.getElementById('modal-' + name);
    if (!modal) return;
    const backdrop = modal.querySelector('.modal__backdrop');
    const closeBtn = modal.querySelector('.modal__close');

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll(`[data-modal="${name}"]`).forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      });
    });

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  setupModal('privacy');
  setupModal('nda');

  // Mobile hamburger
  const burger = document.getElementById('navBurger');
  const navCenter = document.querySelector('.nav__center');
  const navRight = document.querySelector('.nav__right');
  if (burger) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('is-open');
      navCenter?.classList.toggle('is-open', isOpen);
      navRight?.classList.toggle('is-open', isOpen);
    });
    document.querySelectorAll('.nav__center a, .nav__right a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('is-open');
        navCenter?.classList.remove('is-open');
        navRight?.classList.remove('is-open');
      });
    });
  }
})();
