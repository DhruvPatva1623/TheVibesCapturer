/**
 * cinematic.js — TheVibesCapturer
 * Safe, lightweight version — no Lenis conflicts
 */

/* ─── Immediate Theme Check (Prevents Flash) ─────────────────── */
(function() {
  var savedTheme = localStorage.getItem('tvc_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }
})();

/* ─── Global helpers ─────────────────────────────────────────── */
window.toggleTheme = function() {
  document.documentElement.classList.toggle('light-theme');
  var isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('tvc_theme', isLight ? 'light' : 'dark');

  // Synthesize a satisfying mechanical camera shutter click!
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      var ctx = new AudioCtx();
      
      // Mirror flip sound
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(90, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Shutter blades snap sound
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1100, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
      gain2.gain.setValueAtTime(0.35, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.05);
    }
  } catch(e) {}
};

window.switchTab = function(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.admin-tab-content').forEach(function(c) { c.style.display = 'none'; });
  if (btn) btn.classList.add('active');
  var content = document.getElementById('tab-' + tab);
  if (content) content.style.display = '';
};

window.saveReelUrl = function() {
  var input = document.getElementById('reel-url-input');
  if (!input) return;
  var url = input.value.trim();
  if (!url) return;
  localStorage.setItem('tvc_reel_url', url);
  showToast('Showreel URL saved!', 'success');
};

window.playReel = function() {
  var url = localStorage.getItem('tvc_reel_url') || '';
  if (!url) { showToast('No showreel URL set. Add via Admin → Settings.', 'error'); return; }
  var embed = document.getElementById('reel-embed');
  var ph = document.getElementById('reel-placeholder');
  if (!embed || !ph) return;
  embed.innerHTML = '<iframe src="' + url + '?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>';
  embed.style.display = '';
  ph.style.display = 'none';
};

window.toggleMobileNav = function() {
  var nav = document.getElementById('mobile-nav');
  var btn = document.getElementById('hamburger');
  if (!nav) return;
  var isOpen = nav.classList.toggle('open');
  if (btn) btn.setAttribute('aria-expanded', isOpen.toString());
  document.body.style.overflow = isOpen ? 'hidden' : '';
};

window.showToast = function(msg, type) {
  type = type || 'info';
  var c = document.getElementById('toast-container');
  if (!c) return;
  var t = document.createElement('div');
  t.className = 'toast toast--' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function() {
    t.style.transition = 'opacity 0.3s';
    t.style.opacity = '0';
    setTimeout(function() { if (t.parentNode) t.remove(); }, 300);
  }, 3500);
};

/* ─── Loader ─────────────────────────────────────────────────── */
(function() {
  var loader = document.getElementById('loader');
  var loaderNum = document.getElementById('loader-num');
  var loaderBar = document.querySelector('.loader-bar');
  if (!loader) return;

  var start = Date.now();
  var dur = 1600;

  function tick() {
    var t = Math.min((Date.now() - start) / dur, 1);
    var ease = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
    var pct = Math.floor(ease * 100);
    if (loaderNum) loaderNum.textContent = pct;
    if (loaderBar) loaderBar.style.width = pct + '%';
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(function() {
        loader.classList.add('done');
        document.body.classList.remove('loading');
      }, 200);
    }
  }
  requestAnimationFrame(tick);
})();

/* ─── Main init — wait for everything to load ───────────────── */
window.addEventListener('load', function() {

  /* ── 1. GSAP Animations ────────────────────────────────── */
  if (typeof gsap !== 'undefined') {
    try {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }

      /* Hero title char split */
      var splitEls = document.querySelectorAll('[data-split]');
      splitEls.forEach(function(el) {
        var text = el.textContent;
        el.innerHTML = '';
        el.style.overflow = 'hidden';
        text.split('').forEach(function(ch) {
          var s = document.createElement('span');
          s.textContent = ch === ' ' ? '\u00A0' : ch;
          s.className = 'char';
          s.style.cssText = 'display:inline-block;opacity:0;transform:translateY(45px)';
          el.appendChild(s);
        });
      });

      gsap.to('.hero-text-wrap', {
        opacity: 1, y: 0,
        duration: 1.0, ease: 'power3.out', delay: 0.2
      });
      gsap.to('.hero-cta', { opacity: 1, y: 0, duration: 0.7, delay: 0.6, ease: 'power2.out' });
      gsap.to('.hero-stats-bar', { opacity: 1, duration: 0.6, delay: 1.0 });
      gsap.to('.scroll-hint', { opacity: 1, duration: 0.5, delay: 1.2 });

      /* Section scroll reveals & Decode Effect */
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            var el = e.target;
            var d = parseInt(el.getAttribute('data-delay') || '0');
            setTimeout(function() { 
              el.classList.add('revealed'); 
              
              // Active Theory Vibe: Text Decode Effect
              if (el.classList.contains('section-title')) {
                var original = el.getAttribute('data-original') || el.textContent;
                el.setAttribute('data-original', original);
                var chars = "01#X+*/>";
                var iterations = 0;
                var interval = setInterval(function() {
                  el.textContent = original.split('').map(function(letter, index) {
                    if(letter === ' ') return ' ';
                    if(index < iterations) return letter;
                    return chars[Math.floor(Math.random() * chars.length)];
                  }).join('');
                  if(iterations >= original.length) clearInterval(interval);
                  iterations += 1/2;
                }, 40);
              }
            }, d);
            io.unobserve(el);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      document.querySelectorAll('[data-reveal]').forEach(function(el) {
        if (!el.closest('.hero-content')) io.observe(el);
      });
      document.querySelectorAll('.service-card').forEach(function(el) { io.observe(el); });
      document.querySelectorAll('.gear-card').forEach(function(el) { io.observe(el); });

      /* ── GSAP ScrollTrigger: Parallax background text ─── */
      if (typeof ScrollTrigger !== 'undefined') {
        document.querySelectorAll('[data-parallax-text]').forEach(function(el) {
          gsap.to(el, {
            x: '-25%',
            ease: 'none',
            scrollTrigger: {
              trigger: el.closest('.section'),
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1
            }
          });
        });
      }

    } catch(err) { console.warn('GSAP error:', err); }
  } else {
    /* No GSAP — just show everything */
    document.querySelectorAll('[data-split]').forEach(function(el) { el.style.opacity = '1'; });
    document.querySelectorAll('.hero-eyebrow,.hero-tagline,.hero-cta,.hero-stats-bar,.scroll-hint').forEach(function(el) { el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  /* ── 2. Navbar scroll state ────────────────────────────── */
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 60) {
        navbar.style.background = 'rgba(12,12,12,0.98)';
        navbar.style.boxShadow = '0 1px 24px rgba(0,0,0,0.6)';
      } else {
        navbar.style.background = 'rgba(12,12,12,0.85)';
        navbar.style.boxShadow = 'none';
      }
    }, { passive: true });
  }

  /* ── 3. Custom Cursor & Magnetic Physics ───────────────── */
  var cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(pointer:fine)').matches) {
    var dot  = cursor.querySelector('.cursor-dot');
    var ring = cursor.querySelector('.cursor-ring');
    var ap   = cursor.querySelector('.cursor-aperture');
    var mx = -300, my = -300, rx = -300, ry = -300;
    var rafId;

    /* Cursor Trail */
    var trails = [];
    var trailCount = 6;
    for (var i = 0; i < trailCount; i++) {
      var t = document.createElement('div');
      t.className = 'cursor-trail';
      t.style.cssText = 'position:absolute; width:4px; height:4px; background:var(--red); border-radius:50%; opacity:' + (1 - i/trailCount) + '; pointer-events:none; transform:translate(-50%,-50%); transition:none; z-index:-1;';
      cursor.appendChild(t);
      trails.push({ el: t, x: -300, y: -300 });
    }

    /* Magnetic Physics for Buttons */
    document.querySelectorAll('.magnetic').forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', function() {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      });
    });

    document.addEventListener('mousemove', function(e) {
      mx = e.clientX; my = e.clientY;
      if (cursor) {
        cursor.style.setProperty('--cx', mx + 'px');
        cursor.style.setProperty('--cy', my + 'px');
      }
    });

    function cursorLoop() {
      rx += (mx - rx) * 0.15; // Slightly faster follow for better feel
      ry += (my - ry) * 0.15;
      if (cursor) {
        cursor.style.setProperty('--rx', rx + 'px');
        cursor.style.setProperty('--ry', ry + 'px');
      }
      
      /* Update trails */
      var tx = mx, ty = my;
      for (var i = 0; i < trailCount; i++) {
        var tr = trails[i];
        tr.x += (tx - tr.x) * 0.25;
        tr.y += (ty - tr.y) * 0.25;
        tr.el.style.transform = 'translate3d(' + tr.x + 'px, ' + tr.y + 'px, 0) translate(-50%, -50%)';
        tx = tr.x;
        ty = tr.y;
      }
      
      rafId = requestAnimationFrame(cursorLoop);
    }
    cursorLoop();

    document.querySelectorAll('a, button, .filter-pill, .reel-play-btn').forEach(function(el) {
      el.addEventListener('mouseenter', function() { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function() { document.body.classList.remove('cursor-hover'); });
    });
    document.addEventListener('mouseleave', function() { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function() { cursor.style.opacity = '1'; });
  }

  /* ── 4. Magnetic Buttons ───────────────────────────────── */
  document.querySelectorAll('.magnetic').forEach(function(el) {
    el.addEventListener('mousemove', function(e) {
      var r = el.getBoundingClientRect();
      var dx = (e.clientX - r.left - r.width/2) * 0.25;
      var dy = (e.clientY - r.top  - r.height/2) * 0.25;
      el.style.transform = 'translate('+dx+'px,'+dy+'px)';
    });
    el.addEventListener('mouseleave', function() { el.style.transform = ''; });
  });

  /* ── 5. Three.js Particle Field ────────────────────────── */
  if (typeof THREE !== 'undefined') {
    try {
      var hc = document.getElementById('hero-canvas');
      if (hc) {
        var W = hc.offsetWidth || 1280;
        var H = hc.offsetHeight || 720;
        var renderer = new THREE.WebGLRenderer({ canvas: hc, alpha: true, antialias: false, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(W, H);

        var scene  = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 100);
        camera.position.z = 3;

        /* Particles */
        var N   = 450;
        var pos = new Float32Array(N * 3);
        var col = new Float32Array(N * 3);
        var PAL = [[0.78,0.16,0.16],[0.96,0.83,0.5],[0.72,0.72,0.72]];

        for (var i = 0; i < N; i++) {
          var theta = Math.random() * Math.PI * 2;
          var phi   = Math.acos(2 * Math.random() - 1);
          var r     = 1.5 + Math.random() * 2.5;
          pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
          pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.45;
          pos[i*3+2] = r * Math.cos(phi) * 0.3;
          var c = PAL[Math.floor(Math.random() * PAL.length)];
          col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

        var mat = new THREE.PointsMaterial({ size: 0.02, vertexColors: true, transparent: true, opacity: 0.4 });
        var pts = new THREE.Points(geo, mat);
        scene.add(pts);

        /* ========================================================
           LIGHTING (CRITICAL FOR MODELS)
           ======================================================== */
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        var dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);
        var rimLight = new THREE.PointLight(0xC8282A, 2, 10);
        rimLight.position.set(-2, -1, 2);
        scene.add(rimLight);

        /* ========================================================
           VINTAGE CINEMA CAMERA & LIGHTS (BLENDED & PUSHED BACK)
           ======================================================== */
        var camGroup = new THREE.Group();
        
        // Materials for smooth, blended vintage look (Lighter so they are visible)
        var bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.8 });
        var lensMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });
        var woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.8, metalness: 0.1 });
        var metalMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.7 });
        var filmReelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.4 });

        var bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        camGroup.add(body);

        var reelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32);
        var reel1 = new THREE.Mesh(reelGeo, filmReelMat);
        reel1.rotation.z = Math.PI / 2;
        reel1.position.set(0, 0.45, -0.25);
        camGroup.add(reel1);
        
        var reel2 = new THREE.Mesh(reelGeo, filmReelMat);
        reel2.rotation.z = Math.PI / 2;
        reel2.position.set(0, 0.45, 0.35);
        camGroup.add(reel2);

        var lensGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.4, 32);
        var lens = new THREE.Mesh(lensGeo, lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = -0.8;
        camGroup.add(lens);
        
        var lensGlassGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.05, 32);
        var lensGlassMat = new THREE.MeshStandardMaterial({ color: 0x050505, metalness:1, roughness:0, transparent:true, opacity:0.8 });
        var lensGlass = new THREE.Mesh(lensGlassGeo, lensGlassMat);
        lensGlass.rotation.x = Math.PI / 2;
        lensGlass.position.z = -1.0;
        camGroup.add(lensGlass);

        var crankGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.85, 16);
        var crank = new THREE.Mesh(crankGeo, metalMat);
        crank.rotation.z = Math.PI / 2;
        crank.position.set(0, 0, 0);
        camGroup.add(crank);

        // Removed tripod legs as per user request
        // Scale and position
        camGroup.scale.set(1.4, 1.4, 1.4);
        camGroup.position.set(4.0, -0.5, -3.0); 
        camGroup.rotation.y = Math.PI - 0.4; // Lens facing towards viewer (with slight angle)
        scene.add(camGroup);

        // ── Vintage Fresnel Studio Lights (Scaled and Pushed Back) ──
        var fresnelBodyMat = new THREE.MeshStandardMaterial({ color: 0x11151a, roughness: 0.5, metalness: 0.6 });
        var barnDoorMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
        var whiteGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        function createFresnelLight(isLeft) {
            var group = new THREE.Group();
            
            // Removed stand as per user request
            var bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.35, 32);
            var lightBody = new THREE.Mesh(bodyGeo, fresnelBodyMat);
            lightBody.rotation.x = Math.PI / 2;
            group.add(lightBody);

            var faceGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.02, 32);
            var face = new THREE.Mesh(faceGeo, whiteGlowMat);
            face.rotation.x = Math.PI / 2;
            face.position.z = 0.18;
            group.add(face);

            var doorGeo = new THREE.PlaneGeometry(0.25, 0.3);
            var d1 = new THREE.Mesh(doorGeo, barnDoorMat); d1.position.set(0, 0.28, 0.25); d1.rotation.x = Math.PI / 5;
            var d2 = new THREE.Mesh(doorGeo, barnDoorMat); d2.position.set(0, -0.28, 0.25); d2.rotation.x = -Math.PI / 5;
            var d3 = new THREE.Mesh(doorGeo, barnDoorMat); d3.position.set(-0.28, 0, 0.25); d3.rotation.y = -Math.PI / 5; d3.rotation.z = Math.PI/2;
            var d4 = new THREE.Mesh(doorGeo, barnDoorMat); d4.position.set(0.28, 0, 0.25); d4.rotation.y = Math.PI / 5; d4.rotation.z = Math.PI/2;
            group.add(d1); group.add(d2); group.add(d3); group.add(d4);

            var color = isLeft ? 0xffeebb : 0xbbeeff;
            var spotLight = new THREE.SpotLight(color, 0); 
            spotLight.position.set(0, 0, 0.3);
            spotLight.angle = Math.PI / 4;
            spotLight.penumbra = 0.8;
            spotLight.distance = 25;
            var target = new THREE.Object3D();
            target.position.set(0, 0, 10);
            group.add(target);
            spotLight.target = target;
            group.add(spotLight);

            group.spotLight = spotLight;
            group.glowFace = face;
            return group;
        }

        var studioLight = createFresnelLight(true);
        studioLight.scale.set(1.5, 1.5, 1.5);
        studioLight.position.set(-4.5, 0.0, -3.0);
        studioLight.lookAt(0, 0, 0); 
        scene.add(studioLight);

        // ── Sleek Light Toggle Logic ──
        window.studioLightsOn = false;
        var toggleBtn = document.getElementById('studio-light-toggle');
        var toggleSwitch = document.getElementById('light-toggle-switch');
        var toggleKnob = document.getElementById('light-toggle-knob');
        
        if(toggleBtn) {
            toggleBtn.addEventListener('mouseenter', () => toggleBtn.style.opacity = '1');
            toggleBtn.addEventListener('mouseleave', () => toggleBtn.style.opacity = '0.5');
            toggleBtn.addEventListener('click', () => {
                window.studioLightsOn = !window.studioLightsOn;
                if(window.studioLightsOn) {
                    toggleSwitch.style.background = 'var(--red)';
                    toggleSwitch.style.borderColor = 'var(--red)';
                    toggleKnob.style.background = 'var(--white)';
                    toggleKnob.style.transform = 'translateX(26px)';
                } else {
                    toggleSwitch.style.background = 'transparent';
                    toggleSwitch.style.borderColor = 'var(--border-2)';
                    toggleKnob.style.background = 'var(--text-2)';
                    toggleKnob.style.transform = 'translateX(0)';
                }
            });
        }

        var tgtX = 0, tgtY = 0, frame = 0, scrollY = 0;
        document.addEventListener('mousemove', function(e) {
          tgtX = (e.clientX / window.innerWidth  - 0.5) * 0.25;
          tgtY = (e.clientY / window.innerHeight - 0.5) * 0.18;
        });
        window.addEventListener('scroll', function() {
          scrollY = window.scrollY;
        }, { passive: true });

        function render3D() {
          requestAnimationFrame(render3D);
          if (scrollY > H + 200) return; // Skip rendering when out of view
          frame++;
          
          /* Auto rotation + scroll rotation */
          pts.rotation.y += 0.0005;
          pts.rotation.x = scrollY * 0.0002;
          pts.position.y = scrollY * 0.001;
          
          // Smoothly toggle studio lights and glow
          var targetIntensity = window.studioLightsOn ? 2.5 : 0;
          studioLight.spotLight.intensity += (targetIntensity - studioLight.spotLight.intensity) * 0.05;
          
          var glowColor = window.studioLightsOn ? 1.0 : 0.05; 
          studioLight.glowFace.material.color.setRGB(glowColor, glowColor, glowColor);

          // Camera floating animation
          var orbitSpeed = frame * 0.005;
          camGroup.position.x = 4.0 + Math.sin(orbitSpeed) * 0.1;
          camGroup.position.y = -0.5 + Math.cos(orbitSpeed * 0.8) * 0.1 + scrollY * -0.0015;
          // Keep lens facing forward
          camGroup.rotation.z = Math.sin(frame * 0.01) * 0.02; 
          camGroup.rotation.y = Math.PI - 0.4 + Math.sin(frame * 0.005) * 0.05;

          camera.position.x += (tgtX - camera.position.x) * 0.05;
          camera.position.y += (-tgtY - camera.position.y) * 0.05;
          mat.opacity = 0.4 + Math.sin(frame * 0.016) * 0.12;
          renderer.render(scene, camera);
        }
        render3D();

        window.addEventListener('resize', function() {
          var w = hc.offsetWidth, h = hc.offsetHeight;
          if (w && h) { renderer.setSize(w,h); camera.aspect = w/h; camera.updateProjectionMatrix(); }
        });
      }
    } catch(e) { console.warn('Three.js:', e); }
  }

  /* ── 6. Cinematic HUD Timecode ───────────────────────────── */
  var timecodeEl = document.getElementById('hud-timecode');
  if (timecodeEl) {
    var frames = 0, secs = 0, mins = 0, hrs = 0;
    setInterval(function() {
      frames++;
      if (frames >= 24) { frames = 0; secs++; }
      if (secs >= 60) { secs = 0; mins++; }
      if (mins >= 60) { mins = 0; hrs++; }
      var pad = function(n) { return n < 10 ? '0'+n : n; };
      timecodeEl.textContent = pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + ':' + pad(frames);
    }, 1000 / 24); // 24 FPS
  }

  /* ── 7. Film Grain & Timecode Handled Globally ── */

  /* ── 8. Scroll hint hide ───────────────────────────────── */
  var hint = document.querySelector('.scroll-hint');
  if (hint) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 80) hint.style.opacity = '0';
    }, { passive: true });
  }

  /* ── 8b. Lens Flare follows mouse in hero ──────────────── */
  var flare = document.getElementById('lens-flare');
  if (flare) {
    document.querySelector('.hero').addEventListener('mousemove', function(e) {
      flare.style.left = (e.clientX - 100) + 'px';
      flare.style.top  = (e.clientY - 100) + 'px';
    });
  }

  /* ── 8c. Generate film strip perforations ──────────────── */
  document.querySelectorAll('.film-strip-track').forEach(function(track) {
    var perfCount = 80; // enough for seamless loop
    var html = '';
    for (var i = 0; i < perfCount; i++) {
      html += '<div class="film-perf"></div>';
    }
    track.innerHTML = html + html; // duplicate for seamless
  });

  /* ── 8d. Generate waveform bars ────────────────────────── */
  var waveform = document.getElementById('waveform-deco');
  if (waveform) {
    var barCount = 80;
    var html = '';
    for (var i = 0; i < barCount; i++) {
      var h = 10 + Math.random() * 40;
      var delay = (Math.random() * 1.5).toFixed(2);
      html += '<div class="bar" style="height:' + h + 'px;animation-delay:' + delay + 's"></div>';
    }
    waveform.innerHTML = html;
  }

  /* ── 8e. Gear progress bars fill on reveal ─────────────── */
  var gearIO = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var bar = e.target.querySelector('.gear-bar');
        if (bar) {
          var w = getComputedStyle(bar).getPropertyValue('--bar-w') || '0%';
          setTimeout(function() { bar.style.width = w; }, 200);
        }
        gearIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.gear-card').forEach(function(c) { gearIO.observe(c); });

  /* ── 8f. Button ripple effect ──────────────────────────── */
  document.querySelectorAll('.btn-primary, .btn-ghost').forEach(function(btn) {
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function(e) {
      var r = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      var size = Math.max(r.width, r.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - r.left - size/2) + 'px';
      ripple.style.top  = (e.clientY - r.top  - size/2) + 'px';
      btn.appendChild(ripple);
      setTimeout(function() { if (ripple.parentNode) ripple.remove(); }, 700);
    });
  });

  /* ── 9. Stats counter ──────────────────────────────────── */
  setTimeout(function() {
    document.querySelectorAll('.hstat-num[data-count]').forEach(function(el) {
      var target = parseInt(el.getAttribute('data-count'));
      var v = 0, step = target / 45;
      var t = setInterval(function() {
        v = Math.min(v + step, target);
        el.textContent = Math.ceil(v);
        if (v >= target) clearInterval(t);
      }, 30);
    });
  }, 1300);

  /* ── 10. Nav active section highlight ─────────────────── */
  var navLinks = document.querySelectorAll('.nav-link[data-nav]');
  if (navLinks.length) {
    var secIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          var id = e.target.id;
          navLinks.forEach(function(l) {
            l.classList.toggle('active', l.getAttribute('href') === '#'+id);
          });
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('section[id]').forEach(function(s) { secIO.observe(s); });
  }

  /* ── 11. Smooth anchor scroll ──────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var href = a.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var mn = document.getElementById('mobile-nav');
      if (mn && mn.classList.contains('open')) {
        mn.classList.remove('open');
        document.body.style.overflow = '';
      }
      window.scrollTo({ top: target.offsetTop - 68, behavior: 'smooth' });
    });
  });

  /* ── 12. Contact form ──────────────────────────────────── */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = document.getElementById('contact-submit');
      var span = btn && btn.querySelector('span');
      if (span) span.textContent = 'Sent ✓';
      if (btn) btn.style.background = '#3ecf6e';
      setTimeout(function() {
        if (span) span.textContent = 'Send Message';
        if (btn) btn.style.background = '';
        form.reset();
      }, 3000);
      showToast("Message sent! I'll be in touch.", 'success');
    });
  }

  /* ── 13. Footer year ───────────────────────────────────── */
  var yr = document.getElementById('footer-year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── 14. Reel URL pre-fill ─────────────────────────────── */
  var reelInput = document.getElementById('reel-url-input');
  if (reelInput) {
    var saved = localStorage.getItem('tvc_reel_url');
    if (saved) reelInput.value = saved;
  }

}); /* end window.load */
