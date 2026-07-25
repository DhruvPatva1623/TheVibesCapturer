/**
 * TvC 3D Effects — TheVibesCapturer
 * Three.js particle aperture + CSS 3D card tilts
 */
(function () {
  'use strict';

  /* ─── 1. Three.js Hero Particle Field ──────────────────── */
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 5;

    /* ── Aperture particle ring ── */
    const COUNT = 280;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const angle  = (i / COUNT) * Math.PI * 2;
      const radius = 2.2 + (Math.random() - 0.5) * 1.8;
      const layer  = Math.floor(Math.random() * 4);

      positions[i * 3]     = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;

      // Alternate red / gold / white particles matching logo
      if (layer === 0) { colors[i*3]=0.78; colors[i*3+1]=0.16; colors[i*3+2]=0.16; } // red
      else if (layer === 1) { colors[i*3]=0.96; colors[i*3+1]=0.84; colors[i*3+2]=0.50; } // gold
      else { colors[i*3]=1; colors[i*3+1]=1; colors[i*3+2]=1; } // white

      sizes[i] = Math.random() * 3 + 1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

    const mat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    /* ── Inner aperture wireframe ring ── */
    const innerGeo = new THREE.TorusGeometry(1.2, 0.005, 3, 120);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xC8282A, transparent: true, opacity: 0.25 });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerRing);

    const midGeo = new THREE.TorusGeometry(1.8, 0.003, 3, 120);
    const midMat = new THREE.MeshBasicMaterial({ color: 0xF5D580, transparent: true, opacity: 0.15 });
    const midRing = new THREE.Mesh(midGeo, midMat);
    scene.add(midRing);

    /* ── Floating dust particles ── */
    const dustCount = 120;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3]     = (Math.random() - 0.5) * 14;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, transparent: true, opacity: 0.18 });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    /* ── Mouse parallax ── */
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.8;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    });

    /* ── Animate ── */
    let tick = 0;
    function animate() {
      requestAnimationFrame(animate);
      tick += 0.004;

      particles.rotation.z += 0.0006;
      innerRing.rotation.z  += 0.004;
      innerRing.rotation.x  = Math.sin(tick * 0.5) * 0.3;
      midRing.rotation.z    -= 0.002;
      midRing.rotation.y    = Math.sin(tick * 0.4) * 0.2;
      dust.rotation.y       += 0.0003;

      // Smooth camera follow mouse
      camera.position.x += (mouseX - camera.position.x) * 0.04;
      camera.position.y += (-mouseY - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
    animate();

    /* ── Resize ── */
    window.addEventListener('resize', () => {
      const nW = window.innerWidth, nH = window.innerHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    });
  }

  /* ─── 2. CSS 3D Tilt on Service & Gallery Cards ─────────── */
  function initTiltCards() {
    function bindTilt(el) {
      el.addEventListener('mousemove', (e) => {
        const rect   = el.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = (e.clientX - cx) / (rect.width  / 2);
        const dy     = (e.clientY - cy) / (rect.height / 2);
        const rotX   = -dy * 10;
        const rotY   =  dx * 10;
        el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px) scale(1.02)`;
        const shine = el.querySelector('.card-3d-shine');
        if (shine) {
          shine.style.background = `radial-gradient(circle at ${(dx+1)*50}% ${(dy+1)*50}%, rgba(255,255,255,0.10) 0%, transparent 65%)`;
        }
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        const shine = el.querySelector('.card-3d-shine');
        if (shine) shine.style.background = '';
      });
    }

    document.querySelectorAll('.tilt-card, .card-3d').forEach(bindTilt);

    // Re-run for dynamically added gallery items
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.gallery-item:not([data-tilt])').forEach(el => {
        el.setAttribute('data-tilt', '1');
        bindTilt(el);
      });
    });
    const grid = document.getElementById('gallery-grid');
    if (grid) observer.observe(grid, { childList: true });
  }

  /* ─── 3. Aperture CSS Ring Animation ────────────────────── */
  function initAperture() {
    const aperture = document.querySelector('.aperture-3d');
    if (!aperture) return;

    // Scroll-speed variation
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      aperture.style.transform = `translateY(${scrolled * 0.15}px) scale(${1 + scrolled * 0.00015})`;
      aperture.style.opacity   = Math.max(0, 1 - scrolled / 600);
    });
  }

  /* ─── 4. Parallax depth on scroll ───────────────────────── */
  function initParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroBg.style.transform = `translateY(${y * 0.3}px)`;
    }, { passive: true });
  }

  /* ─── 5. Film grain overlay (canvas) ────────────────────── */
  function initFilmGrain() {
    const grain = document.createElement('canvas');
    grain.id = 'film-grain';
    grain.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999', 'pointer-events:none',
      'opacity:0.03', 'mix-blend-mode:overlay', 'width:100%', 'height:100%'
    ].join(';');
    document.body.appendChild(grain);

    const ctx = grain.getContext('2d');
    grain.width  = 256;
    grain.height = 256;

    function drawGrain() {
      const imageData = ctx.createImageData(256, 256);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() * 255 | 0;
        imageData.data[i]   = v;
        imageData.data[i+1] = v;
        imageData.data[i+2] = v;
        imageData.data[i+3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      setTimeout(() => requestAnimationFrame(drawGrain), 80);
    }
    drawGrain();
  }

  /* ─── Boot ───────────────────────────────────────────────── */
  function boot() {
    initHeroCanvas();
    initTiltCards();
    initAperture();
    initParallax();
    initFilmGrain();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
