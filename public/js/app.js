(() => {
  const MAX_PHOTOS = 50;
  let photos = [];
  let currentIndex = 0;
  let idleTimer = null;
  const IDLE_TIMEOUT = 45_000;

  const wallEl = document.getElementById('photo-wall');
  const lightboxEl = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const countEl = document.getElementById('photo-count');
  const emptyEl = document.getElementById('empty-state');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const particlesEl = document.getElementById('particles');

  const floatClasses = ['float-1','float-2','float-3','float-4','float-5'];
  const heartEmojis = ['\u2764','\uD83E\uDD0E','\uD83C\uDF4A','\uD83E\UDDE1','\u2728','\uD83D\uDC9B','\uD83D\uDC96','\uD83D\uDC9D'];
  let heartThrottle = 0;
  const warmColors = [
    'rgba(255,183,130,0.5)','rgba(244,162,148,0.4)','rgba(242,198,122,0.4)',
    'rgba(248,170,160,0.35)','rgba(255,200,170,0.45)','rgba(255,160,122,0.4)',
    'rgba(255,190,140,0.35)','rgba(255,140,130,0.3)',
  ];
  const fireflyColors = [
    '#fef3e2','#ffd89b','#ffecd2','#ffe0b2','#fff3e0','#ffcc80','#ffab91',
  ];

  /* ---- Init ---- */
  function init() {
    fetchPhotos();
    createParticles();
    createOrbs();
    createFireflies();
    createSparkles();
    createGlowRings();
    bindEvents();
    shuffleBtn.classList.add('pulse');
  }

  /* ---- Fetch ---- */
  async function fetchPhotos() {
    try {
      const res = await fetch('/api/photos');
      if (!res.ok) throw new Error('API error');
      const all = await res.json();
      photos = all.slice(0, MAX_PHOTOS);
      if (!photos.length) {
        wallEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        countEl.textContent = '';
      } else {
        wallEl.style.display = '';
        emptyEl.style.display = 'none';
        countEl.textContent = `showing ${photos.length} / ${all.length}`;
        renderCards();
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
      wallEl.innerHTML = '<p style="padding:80px;text-align:center;color:var(--text-light);position:relative;z-index:1">Failed to load photos.</p>';
      wallEl.style.display = 'block';
      emptyEl.style.display = 'none';
    }
  }

  /* ---- Loose Frame Wall Layout ---- */
  function calcPositions() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Responsive columns based on screen width
    let cols;
    if (W <= 480) {
      cols = 3; // Mobile: 3 columns
    } else if (W <= 768) {
      cols = 4; // Tablet: 4 columns
    } else if (W <= 1024) {
      cols = 6; // Small desktop: 6 columns
    } else {
      cols = 6; // Desktop: 6 columns
    }

    const cardW = 280;  // base card width (2x for desktop)
    const cardH = 110;  // fixed card height (19:6 aspect ratio, 2x for desktop)
    const gapX = 8;     // horizontal gap between cards (compact)
    const gapY = 70;    // vertical spacing

    // Calculate content dimensions and center offset
    const rows = Math.ceil(photos.length / cols);
    const contentWidth = cols * cardW + (cols - 1) * gapX;
    const contentHeight = rows * cardH + (rows - 1) * gapY;
    const offsetX = (W - contentWidth) / 2;
    const offsetY = Math.max(60, (H - contentHeight) / 2); // top margin at least 60px

    const positions = [];
    for (let i = 0; i < photos.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Base grid position - centered layout with compact horizontal spacing
      let x = offsetX + col * (cardW + gapX);
      let y = offsetY + row * (cardH + gapY);

      // Add slight random offset (like real frames not perfectly aligned)
      x += rand(-4, 4);
      y += rand(-6, 6);

      // Small rotation (-5 to 5 degrees, subtle)
      const rot = rand(-5, 5);

      // Vary card size slightly (scaled with cardW)
      const w = rand(cardW - 10, cardW + 20);

      positions.push({ x, y, rot, w });
    }

    // Shuffle positions for natural look
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Assign z-index based on position (lower = front)
    positions.sort((a, b) => a.y - b.y);
    return positions;
  }

  /* ---- Render ---- */
  function renderCards() {
    wallEl.innerHTML = '';
    const positions = calcPositions();

    photos.forEach((photo, i) => {
      const pos = positions[i % positions.length];
      const card = document.createElement('div');
      card.className = 'photo-card card-enter';
      card.style.animationDelay = `${i * 0.03}s`;
      card.style.left = pos.x + 'px';
      card.style.top = pos.y + 'px';
      card.style.zIndex = i + 1;
      card.style.transform = `rotate(${pos.rot}deg)`;

      // Shimmer
      const shimmer = document.createElement('div');
      shimmer.className = 'shimmer';
      card.appendChild(shimmer);

      // Image
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = photo.name;
      img.loading = 'lazy';
      img.style.width = pos.w + 'px';
      img.style.minHeight = (pos.w * 0.6) + 'px';
      img.onload = () => card.classList.add('loaded');
      card.appendChild(img);

      // Store base rotation for hover
      card._rot = pos.rot;

      // Mouse-follow interaction + heart trail
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const py = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        card.style.boxShadow = `${-px * 18}px ${-py * 18 + 12}px 40px rgba(255,160,110,0.5)`;
        card.style.transform = `rotate(0deg) scale(1.18) translate(${-px * 6}px, ${-py * 6}px)`;

        // Heart trail (throttled ~60ms)
        const now = Date.now();
        if (now - heartThrottle > 60) {
          heartThrottle = now;
          spawnHeart(e.clientX, e.clientY);
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.boxShadow = '';
        card.style.transform = `rotate(${card._rot}deg)`;
      });

      card.addEventListener('click', () => openLightbox(i));

      // Floating after entry
      const fcls = floatClasses[Math.floor(Math.random() * floatClasses.length)];
      setTimeout(() => { card.classList.add(fcls); }, (0.7 + i * 0.03) * 1000);

      wallEl.appendChild(card);
    });
  }

  /* ---- Heart Trail ---- */
  function spawnHeart(x, y) {
    const heart = document.createElement('span');
    heart.className = 'heart-trail';
    heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    const size = rand(12, 22);
    Object.assign(heart.style, {
      left: (x + rand(-10, 10)) + 'px',
      top: (y + rand(-10, 10)) + 'px',
      fontSize: size + 'px',
    });
    document.body.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove());
  }

  /* ---- Particles ---- */
  function createParticles() {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const size = rand(3, 14);
      Object.assign(p.style, {
        left: rand(-5, 105) + 'vw',
        width: size + 'px', height: size + 'px',
        animationDuration: rand(10, 20) + 's',
        animationDelay: rand(-5, 10) + 's',
        background: warmColors[Math.floor(Math.random() * warmColors.length)],
        '--drift': rand(-40, 60) + 'px',
      });
      particlesEl.appendChild(p);
    }
  }

  function createOrbs() {
    for (let i = 0; i < 6; i++) {
      const orb = document.createElement('div');
      orb.className = 'orb ' + (Math.random() > 0.5 ? 'orb-1' : 'orb-2');
      const size = rand(80, 200);
      const c = warmColors[Math.floor(Math.random() * warmColors.length)];
      Object.assign(orb.style, {
        width: size + 'px', height: size + 'px',
        top: rand(15, 75) + '%', left: rand(-5, 85) + '%',
        background: `radial-gradient(circle, ${c}, transparent 70%)`,
        animationDuration: rand(14, 26) + 's',
        animationDelay: rand(-6, 6) + 's',
      });
      particlesEl.appendChild(orb);
    }
  }

  function createFireflies() {
    for (let i = 0; i < 18; i++) {
      const ff = document.createElement('div');
      ff.className = 'firefly';
      const color = fireflyColors[Math.floor(Math.random() * fireflyColors.length)];
      const size = rand(4, 7);
      Object.assign(ff.style, {
        top: rand(10, 80) + '%', left: rand(5, 90) + '%',
        width: size + 'px', height: size + 'px',
        color, background: color,
        animationDuration: rand(4, 8) + 's',
        animationDelay: rand(-3, 5) + 's',
      });
      particlesEl.appendChild(ff);
    }
  }

  function createSparkles() {
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      Object.assign(s.style, {
        top: rand(5, 85) + '%', left: rand(5, 85) + '%',
        width: rand(8, 14) + 'px', height: rand(8, 14) + 'px',
        animationDuration: rand(4, 9) + 's',
        animationDelay: rand(-2, 4) + 's',
      });
      particlesEl.appendChild(s);
    }
  }

  function createGlowRings() {
    for (let i = 0; i < 4; i++) {
      const ring = document.createElement('div');
      ring.className = 'glow-ring';
      const size = rand(120, 280);
      Object.assign(ring.style, {
        width: size + 'px', height: size + 'px',
        top: rand(15, 70) + '%', left: rand(15, 70) + '%',
        borderColor: warmColors[Math.floor(Math.random() * warmColors.length)],
        animationDuration: rand(16, 28) + 's',
        animationDelay: rand(-8, 4) + 's',
      });
      particlesEl.appendChild(ring);
    }
  }

  /* ---- Utility ---- */
  function rand(a, b) { return Math.random() * (b - a) + a; }

  /* ---- Lightbox ---- */
  function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetIdle();
  }
  function closeLightbox() {
    lightboxEl.classList.remove('active');
    document.body.style.overflow = '';
  }
  function updateLightboxImage() {
    const photo = photos[currentIndex];
    if (!photo) return;
    lightboxImg.src = photo.url;
    lightboxImg.alt = photo.name;
    lightboxCounter.textContent = `${currentIndex + 1} / ${photos.length}`;
  }
  function navLightbox(dir) {
    currentIndex = (currentIndex + dir + photos.length) % photos.length;
    updateLightboxImage();
    resetIdle();
  }

  /* ---- Shuffle ---- */
  function doShuffle() {
    shuffleBtn.classList.remove('pulse');
    wallEl.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    fetchPhotos();
    setTimeout(() => shuffleBtn.classList.add('pulse'), 3000);
    resetIdle();
  }

  /* ---- Idle ---- */
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => doShuffle(), IDLE_TIMEOUT);
  }

  /* ---- Events ---- */
  function bindEvents() {
    shuffleBtn.addEventListener('click', doShuffle);
    lightboxEl.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightboxEl.querySelector('.lightbox-nav.prev').addEventListener('click', () => navLightbox(-1));
    lightboxEl.querySelector('.lightbox-nav.next').addEventListener('click', () => navLightbox(1));
    lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navLightbox(-1);
      if (e.key === 'ArrowRight') navLightbox(1);
    });
    ['mousemove','keydown','scroll','touchstart','click'].forEach(evt => {
      window.addEventListener(evt, resetIdle, { passive: true });
    });
  }

  init();
})();
