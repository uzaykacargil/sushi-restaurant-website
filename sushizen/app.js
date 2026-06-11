/* ===================================================
   SUSHI ZEN — app.js
   Interactive logic: navbar, menu filters, modal,
   scroll animations, counter animation
   =================================================== */

/* ─── Navbar: scroll style ──────────────────────── */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

/* ─── Navbar: hamburger mobile menu ────────────── */
const hamburger  = document.getElementById('nav-hamburger');
const navLinks   = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen);

  // Animate hamburger to X
  const spans = hamburger.querySelectorAll('span');
  if (isOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  }
});

// Close mobile menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    const spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  });
});

/* ─── Intersection Observer: fade-in ───────────── */
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger delay for sibling elements
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.fade-in'));
      const index    = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${index * 0.08}s`;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -50px 0px'
});

fadeEls.forEach(el => observer.observe(el));

/* ─── Counter Animation (hero stats) ───────────── */
const counters = document.querySelectorAll('[data-count]');

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach(el => counterObserver.observe(el));

function animateCounter(el) {
  const target   = parseInt(el.getAttribute('data-count'), 10);
  const duration = 1800;
  const start    = performance.now();

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quart
    const eased    = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ─── Menu Filters ──────────────────────────────── */
const filterBtns  = document.querySelectorAll('.filter-btn');
const menuCards   = document.querySelectorAll('.menu-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Active state
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');

    menuCards.forEach((card, i) => {
      const category = card.getAttribute('data-category');
      const show     = filter === 'all' || category === filter;

      if (show) {
        card.classList.remove('hidden');
        // Re-trigger animation with stagger
        card.style.animationDelay = `${i * 0.06}s`;
        card.style.animation      = 'none';
        void card.offsetHeight;   // reflow
        card.style.animation      = 'scaleIn 0.4s ease both';
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

/* ─── "Add to order" button feedback ───────────── */
menuCards.forEach(card => {
  const btn = card.querySelector('.menu-card-order');
  if (!btn) return;

  btn.addEventListener('click', () => {
    btn.textContent = '✓';
    btn.style.background     = 'var(--wasabi)';
    btn.style.color          = '#fff';
    btn.style.borderColor    = 'var(--wasabi)';
    btn.style.transform      = 'scale(1.15)';

    setTimeout(() => {
      btn.textContent = '+';
      btn.style.background  = '';
      btn.style.color       = '';
      btn.style.borderColor = '';
      btn.style.transform   = '';
    }, 1400);
  });
});

/* ─── Reservation Modal ─────────────────────────── */
const modalOverlay = document.getElementById('modal-overlay');
const resForm      = document.getElementById('reservation-form');
const formSuccess  = document.getElementById('form-success');
const formContent  = document.getElementById('modal-form-content');

function openModal(e) {
  if (e) e.preventDefault();
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Set minimum date to today
  const dateInput = document.getElementById('res-date');
  const today     = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close on overlay click
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

// Form submission
resForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Basic validation
  const firstName = document.getElementById('res-firstname').value.trim();
  const email     = document.getElementById('res-email').value.trim();
  const date      = document.getElementById('res-date').value;
  const time      = document.getElementById('res-time').value;
  const guests    = document.getElementById('res-guests').value;

  if (!firstName || !email || !date || !time || !guests) {
    shakeModal();
    return;
  }

  // Simulate booking — show success
  const submitBtn = document.getElementById('modal-submit-btn');
  submitBtn.textContent = 'Confirming…';
  submitBtn.disabled    = true;

  setTimeout(() => {
    formContent.style.display = 'none';
    formSuccess.classList.add('show');
    resForm.reset();

    // Auto-close after 4 seconds
    setTimeout(() => {
      closeModal();
      setTimeout(() => {
        formContent.style.display  = '';
        formSuccess.classList.remove('show');
        submitBtn.textContent      = 'Confirm Reservation 🍣';
        submitBtn.disabled         = false;
      }, 400);
    }, 4000);
  }, 1000);
});

function shakeModal() {
  const modal = document.getElementById('reservation-modal');
  modal.style.animation = 'none';
  void modal.offsetHeight;
  modal.style.animation = 'shake 0.4s ease';
}

/* ─── Add shake keyframe dynamically ───────────── */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-8px); }
    40%       { transform: translateX(8px); }
    60%       { transform: translateX(-6px); }
    80%       { transform: translateX(6px); }
  }
`;
document.head.appendChild(shakeStyle);

/* ─── Smooth active nav highlighting ───────────── */
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a:not(.nav-reserve-btn)');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === `#${entry.target.id}`) {
          a.style.color = 'var(--gold)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

/* ─── Expose globals for inline onclick ─────────── */
window.openModal  = openModal;
window.closeModal = closeModal;
