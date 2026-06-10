/* =====================================================
   YATAI — app.js
   Cart state, filters, drawer, checkout, animations
   ===================================================== */

/* ─── Cart State ─────────────────────────────────── */
let cart      = [];   // [{ id, name, price, img, qty }]
let orderType = 'delivery';

/* ─── Navbar scroll ──────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ─── Hamburger menu ─────────────────────────────── */
const hamburger = document.getElementById('nav-hamburger');
const navLinks  = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  const [s1, s2, s3] = hamburger.querySelectorAll('span');
  if (open) {
    s1.style.transform = 'rotate(45deg) translate(5px,5px)';
    s2.style.opacity   = '0';
    s3.style.transform = 'rotate(-45deg) translate(5px,-5px)';
  } else {
    s1.style.transform = s2.style.opacity = s3.style.transform = '';
  }
});
navLinks.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = s.style.opacity = ''; });
  });
});

/* ─── Scroll fade-up ─────────────────────────────── */
const fadeEls = document.querySelectorAll('.fade-up');
const fadeObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.fade-up'));
      const idx      = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${idx * 0.07}s`;
      entry.target.classList.add('visible');
      fadeObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
fadeEls.forEach(el => fadeObs.observe(el));

/* ─── Hero counter animation ─────────────────────── */
const counters = document.querySelectorAll('[data-count]');
const cntObs   = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      cntObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
counters.forEach(el => cntObs.observe(el));

function animateCount(el) {
  const target   = parseFloat(el.getAttribute('data-count'));
  const isDecimal = String(target).includes('.');
  const duration = 1600;
  const start    = performance.now();
  function tick(now) {
    const p  = Math.min((now - start) / duration, 1);
    const e  = 1 - Math.pow(1 - p, 4); // ease-out quart
    const v  = e * target;
    el.textContent = isDecimal ? v.toFixed(1) : Math.round(v).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ─── Menu Filters ───────────────────────────────── */
const filterBtns = document.querySelectorAll('.filter-btn');
const menuCards  = document.querySelectorAll('.menu-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');
    menuCards.forEach((card, i) => {
      const match = filter === 'all' || card.dataset.category === filter;
      if (match) {
        card.classList.remove('hidden');
        card.style.animationDelay = `${i * 0.05}s`;
        card.style.animation = 'none';
        void card.offsetHeight;
        card.style.animation = 'fadeUp 0.4s ease both';
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

/* ─── ADD TO CART ────────────────────────────────── */
function addToCart(btn) {
  const card  = btn.closest('.menu-card');
  const id    = card.id;
  const name  = card.dataset.name;
  const price = parseFloat(card.dataset.price);
  const img   = card.dataset.img;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, img, qty: 1 });
  }

  // Button feedback
  btn.classList.add('added');
  btn.textContent = '✓ ADDED';
  setTimeout(() => {
    btn.classList.remove('added');
    btn.textContent = '+ ADD';
  }, 1500);

  updateCartUI();
  openDrawer();
}

/* ─── UPDATE CART UI ─────────────────────────────── */
function updateCartUI() {
  const totalQty   = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = orderType === 'delivery' ? 2.99 : 0;
  const total      = subtotal + deliveryFee;

  // Badge
  const badge = document.getElementById('cart-badge');
  badge.textContent = totalQty;
  badge.classList.toggle('show', totalQty > 0);

  // Empty state
  const empty   = document.getElementById('cart-empty');
  const summary = document.getElementById('cart-summary');
  const checkoutBtn = document.getElementById('checkout-btn');

  empty.style.display   = cart.length === 0 ? 'flex'  : 'none';
  summary.style.display = cart.length === 0 ? 'none'  : 'block';
  checkoutBtn.disabled  = cart.length === 0;

  // Render items
  const container = document.getElementById('cart-items');
  // Remove existing item rows
  container.querySelectorAll('.cart-item').forEach(el => el.remove());

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className   = 'cart-item';
    el.id          = `cart-item-${item.id}`;
    el.innerHTML   = `
      <img class="cart-item-img" src="${item.img}" alt="${item.name}" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)" aria-label="Decrease quantity">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', +1)" aria-label="Increase quantity">+</button>
        <button class="cart-item-remove" onclick="removeItem('${item.id}')" aria-label="Remove ${item.name}">✕</button>
      </div>
    `;
    container.appendChild(el);
  });

  // Summary numbers
  document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('summary-total').textContent    = `$${total.toFixed(2)}`;

  const feeRow = document.getElementById('delivery-fee-row');
  feeRow.style.display = orderType === 'delivery' ? 'flex' : 'none';
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

/* ─── DRAWER open / close ────────────────────────── */
function openDrawer() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── Delivery / Pickup toggle ───────────────────── */
function setOrderType(type) {
  orderType = type;
  document.getElementById('toggle-delivery').classList.toggle('active', type === 'delivery');
  document.getElementById('toggle-pickup').classList.toggle('active',   type === 'pickup');
  document.getElementById('delivery-address').classList.toggle('show',  type === 'delivery');
  updateCartUI();
}

/* ─── CHECKOUT modal ─────────────────────────────── */
function openCheckout() {
  if (cart.length === 0) return;

  // Populate mini summary
  const mini = document.getElementById('mini-items');
  mini.innerHTML = cart.map(i =>
    `<div class="mini-item"><span>${i.name} ×${i.qty}</span><span>$${(i.price * i.qty).toFixed(2)}</span></div>`
  ).join('');

  const deliveryFee = orderType === 'delivery' ? 2.99 : 0;
  const total       = cart.reduce((s, i) => s + i.price * i.qty, 0) + deliveryFee;
  document.getElementById('mini-total-val').textContent = `$${total.toFixed(2)}`;

  // Pre-fill delivery address if entered
  const drawerAddr = document.getElementById('addr-input').value;
  if (drawerAddr) document.getElementById('co-addr').value = drawerAddr;

  // Show/hide address field based on order type
  document.getElementById('co-addr-group').style.display = orderType === 'delivery' ? 'block' : 'none';
  document.getElementById('checkout-modal-sub').textContent =
    orderType === 'delivery' ? 'Delivery order — fill in your details.' : 'Pickup order — fill in your details.';

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeCheckout();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCheckout();
    closeDrawer();
  }
});

/* ─── Form submit ────────────────────────────────── */
document.getElementById('checkout-form').addEventListener('submit', e => {
  e.preventDefault();

  const first = document.getElementById('co-first').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const time  = document.getElementById('co-time').value;
  const addr  = document.getElementById('co-addr').value.trim();

  if (!first || !phone || !time || (orderType === 'delivery' && !addr)) {
    shakeModal();
    return;
  }

  const btn = document.getElementById('submit-order-btn');
  btn.textContent = '⏳ Processing…';
  btn.disabled    = true;

  setTimeout(() => {
    // Show success
    document.getElementById('checkout-form-wrap').style.display = 'none';
    document.getElementById('order-success').classList.add('show');

    // ETA message based on order type
    document.getElementById('eta-badge').textContent =
      orderType === 'delivery' ? '⚡ ETA: 25–35 minutes' : '🏪 Ready in 15–20 minutes';

    // Reset after close
    setTimeout(() => {
      closeCheckout();
      closeDrawer();
      setTimeout(() => {
        cart = [];
        updateCartUI();
        document.getElementById('checkout-form-wrap').style.display = 'block';
        document.getElementById('order-success').classList.remove('show');
        document.getElementById('checkout-form').reset();
        btn.textContent = '🔥 Confirm Order';
        btn.disabled    = false;
      }, 400);
    }, 4500);
  }, 900);
});

function shakeModal() {
  const m = document.getElementById('checkout-modal');
  m.style.animation = 'none';
  void m.offsetHeight;
  m.style.animation = 'shake 0.45s ease';
}

/* ─── Expose globals ─────────────────────────────── */
window.addToCart    = addToCart;
window.changeQty    = changeQty;
window.removeItem   = removeItem;
window.openDrawer   = openDrawer;
window.closeDrawer  = closeDrawer;
window.setOrderType = setOrderType;
window.openCheckout = openCheckout;
window.closeCheckout= closeCheckout;
