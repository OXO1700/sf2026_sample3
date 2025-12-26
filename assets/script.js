/*
  script.js
  - YAML (assets/content.yml) を読み込み、ヒーローとカードを動的にレンダリングします
  - js-yaml を CDN 経由で読み込む必要があります（index.html に追加済み）
*/

console.log('assets/script.js loaded');
let target = null;

// global error handler: show banner so user sees JS errors on page
window.addEventListener('error', function (e) {
  try {
    var existing = document.getElementById('jsErrorBanner');
    if (!existing) {
      var b = document.createElement('div');
      b.id = 'jsErrorBanner';
      b.style.background = '#ffe6e6';
      b.style.color = '#800';
      b.style.padding = '0.6rem';
      b.style.textAlign = 'center';
      b.style.fontWeight = '700';
      b.textContent = 'JavaScript エラーが発生しました。詳細はコンソールを確認してください。';
      document.body.insertAdjacentElement('afterbegin', b);
    }
  } catch (ignore) {}
});

/* Starfield overlay: create a full-viewport canvas and make stars twinkle on scroll */
(function () {
  let canvas, ctx, stars = [], w = 0, h = 0, rafId, lastScrollY = (window.scrollY || 0);

  function resizeCanvas() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createStars(n) {
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseR: Math.random() * 1.4 + 0.4,
        tw: 0,
        alpha: Math.random() * 0.7 + 0.15
      });
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const twFactor = Math.max(0, s.tw);
      const r = s.baseR * (1 + twFactor * 0.9);
      const alpha = Math.min(1, s.alpha + twFactor * 0.8);

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255,255,255,0.95)';
      ctx.shadowBlur = 6 * (1 + twFactor);
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();

      if (s.tw > 0) s.tw -= 0.08; // fade twinkle
    }

    rafId = requestAnimationFrame(draw);
  }

  function handleScroll() {
    const now = window.scrollY || 0;
    const delta = Math.abs(now - lastScrollY);
    lastScrollY = now;

    // number of stars to trigger depends on scroll delta
    const count = Math.min(60, Math.max(3, Math.floor(delta / 18)));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * stars.length);
      if (stars[idx]) stars[idx].tw = 0.6 + Math.random() * 1.6;
    }
  }

  let scrollTimer = null;
  function onScrollThrottled() {
    if (scrollTimer) clearTimeout(scrollTimer);
    handleScroll();
    // small debounce to avoid too-frequent churn
    scrollTimer = setTimeout(function () { scrollTimer = null; }, 40);
  }

  function initStarField() {
    if (document.body.querySelector('.star-overlay')) return; // already initialized
    canvas = document.createElement('canvas');
    canvas.className = 'star-overlay';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');

    resizeCanvas();
    const density = Math.max(90, Math.floor((window.innerWidth * window.innerHeight) / 4200));
    createStars(density);

    window.addEventListener('resize', function () {
      resizeCanvas();
      createStars(Math.max(80, Math.floor((window.innerWidth * window.innerHeight) / 4200)));
    });

    window.addEventListener('scroll', onScrollThrottled, { passive: true });
    // start animation
    draw();
  }

  // If DOM already loaded, init immediately; otherwise wait for DOMContentLoaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initStarField, 60);
  } else {
    document.addEventListener('DOMContentLoaded', initStarField);
  }

  // expose for debugging (optional)
  window.__initStarField = initStarField;
})();

function updateCountdown() {
  if (!target) return;
  const now = new Date();
  const diff = target - now;

  const el = document.getElementById("countdown");
  if (!el) return;

  if (diff <= 0) {
    el.textContent = "文化祭 開催中";
    return;
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000) % 24;
  const m = Math.floor(diff / 60000) % 60;

  // show as: "あと X日 Y時間 Z分" for clearer emphasis
  el.textContent = `あと ${d}日 ${h}時間 ${m}分`;
}

// Animate numbers from 0 to final countdown values over ~2 seconds, then set final digital text
function animateCountUp(el, targetDate) {
  if (!el || !targetDate) return;
  const duration = 2000;
  const startTime = performance.now();

  const now = new Date();
  const diffFinal = Math.max(0, targetDate - now);
  const finalD = Math.floor(diffFinal / 86400000);
  const finalH = Math.floor(diffFinal / 3600000) % 24;
  const finalM = Math.floor(diffFinal / 60000) % 60;

  function tick(ts) {
    const t = Math.min(1, (ts - startTime) / duration);
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

    const curD = Math.floor(finalD * ease);
    const curH = Math.floor(finalH * ease);
    const curM = Math.floor(finalM * ease);

    el.textContent = `あと ${curD}日 ${curH}時間 ${curM}分`;

    if (t < 1) requestAnimationFrame(tick);
    else updateCountdown();
  }

  requestAnimationFrame(tick);
}

function renderCard(card) {
  const section = document.createElement('section');
  section.className = 'card';
  if (card.id) section.id = card.id;

  const h2 = document.createElement('h2');
  h2.textContent = card.title || '';
  section.appendChild(h2);

  if (card.type === 'iframe') {
    const wrap = document.createElement('div'); wrap.className = 'embed-wrap';
    const iframe = document.createElement('iframe');
    iframe.src = card.src || '';
    iframe.width = '100%';
    iframe.height = card.height || 420;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.title = card.title || '';
    wrap.appendChild(iframe);
    section.appendChild(wrap);
    return section;
  }

  if (card.text) {
    const p = document.createElement('p');
    p.textContent = card.text;
    section.appendChild(p);
  }

  if (card.image) {
    const img = document.createElement('img');
    img.src = card.image;
    img.alt = card.image_alt || '';
    img.style.maxWidth = '100%';
    img.style.borderRadius = '10px';
    img.style.marginTop = '0.6rem';
    section.appendChild(img);
  }

  if (card.cta_text && card.cta_url) {
    const a = document.createElement('a');
    a.className = 'button';
    a.href = card.cta_url;
    a.textContent = card.cta_text;
    if (card.download) a.setAttribute('download', '');
    a.style.display = 'inline-block';
    a.style.marginTop = '0.8rem';
    section.appendChild(a);
  }

  return section;
}

// Initialize background overlay behavior: light overlay opacity increases with scroll (0..1)
function initScrollBackground() {
  try {
    const docEl = document.documentElement;
    let ticking = false;

    function update() {
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const winH = window.innerHeight || 1;
      const max = Math.max(docHeight - winH, 1);
      let t = Math.min(Math.max(scrollTop / max, 0), 1);
      // gentle easing: square root for nicer feel (optional)
      t = Math.sqrt(t);
      docEl.style.setProperty('--overlay-opacity', String(t));
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () { update(); ticking = false; });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // set initial
    onScroll();
  } catch (e) {
    // swallow
  }
}

// Initialize tab behavior (used by timetable). Safe to call multiple times.
function initTabsAndPrint() {
  try {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    if (tabs && tabs.length) {
      tabs.forEach(function (btn) {
        // avoid attaching duplicate handlers by checking a flag
        if (btn.__tabInit) return;
        btn.__tabInit = true;
        btn.addEventListener('click', function () {
          const target = document.querySelector(btn.getAttribute('data-target'));
          if (!target) return;
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-panel').forEach(p => { p.classList.remove('active'); p.hidden = true; });
          btn.classList.add('active');
          target.classList.add('active'); target.hidden = false;
        });
      });
    }

    const printBtn = document.getElementById('printTimetable');
    if (printBtn && !printBtn.__printInit) {
      printBtn.__printInit = true;
      printBtn.addEventListener('click', function () { window.print(); });
    }
  } catch (e) { /* ignore */ }
}

// Init project search & filter controls on projects page
function initProjectFilters() {
  try {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.project-card'));
    const search = document.getElementById('projectsSearch');
    const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));

    function applyFilter() {
      const q = search && search.value ? search.value.trim().toLowerCase() : '';
      const active = filterBtns.find(b => b.classList.contains('active'));
      const cat = active && active.getAttribute('data-filter') ? active.getAttribute('data-filter') : '*';

      items.forEach(function (it) {
        const title = (it.querySelector('h3') && it.querySelector('h3').textContent) ? it.querySelector('h3').textContent.toLowerCase() : '';
        const desc = (it.querySelector('p') && it.querySelector('p').textContent) ? it.querySelector('p').textContent.toLowerCase() : '';
        const catAttr = it.getAttribute('data-category') || '';

        const matchesQuery = q === '' || title.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
        const matchesCat = (cat === '*') || (catAttr === cat);

        if (matchesQuery && matchesCat) {
          it.style.display = '';
        } else {
          it.style.display = 'none';
        }
      });
    }

    if (search) {
      search.addEventListener('input', function () { applyFilter(); });
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilter();
      });
    });

    // initial
    applyFilter();
  } catch (e) { console.error('initProjectFilters failed', e); }
}

// Transform existing .badges into #tags (up to 3) and add collapse toggle for description
function initProjectTagsAndToggles() {
  try {
    const cards = Array.from(document.querySelectorAll('.project-card'));
    if (!cards.length) return;

    cards.forEach(function (card) {
      const body = card.querySelector('.project-body');
      if (!body) return;

      // Collect tag texts from .badges .badge
      let tags = [];
      const badgesWrap = body.querySelector('.badges');
      if (badgesWrap) {
        const badges = Array.from(badgesWrap.querySelectorAll('.badge'));
        badges.forEach(function (b) {
          const t = b.textContent && b.textContent.trim();
          if (t) tags.push(t);
        });
      }

      // Fallback: use data-category attribute if no badges found
      if (tags.length === 0) {
        const cat = card.getAttribute('data-category');
        if (cat) tags.push(cat);
      }

      // Limit to 3 tags
      tags = tags.slice(0, 3);

      if (tags.length) {
        const tagList = document.createElement('div');
        tagList.className = 'tag-list';
        tags.forEach(function (t) {
          const el = document.createElement('span');
          el.className = 'tag';
          el.textContent = '#' + t;
          tagList.appendChild(el);
        });

        if (badgesWrap) {
          badgesWrap.replaceWith(tagList);
        } else {
          body.appendChild(tagList);
        }
      }

      // Add collapse toggle to the left of the title to show/hide description (exclude tags)
      const title = body.querySelector('h3');
      const desc = body.querySelector('p');
      if (title) {
        // avoid duplicate initialization
        if (title.__toggleInit) return;
        title.__toggleInit = true;

        const header = document.createElement('div');
        header.className = 'project-header';

        const btn = document.createElement('button');
        btn.className = 'collapse-toggle';
        btn.type = 'button';
        // start collapsed by default
        btn.setAttribute('aria-expanded', 'false');
        btn.title = '説明を折りたたむ/展開する';
        btn.textContent = '+';

        btn.addEventListener('click', function () {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          if (expanded) {
            if (desc) desc.style.display = 'none';
            btn.setAttribute('aria-expanded', 'false');
            btn.textContent = '+';
            card.classList.add('collapsed');
          } else {
                btn.setAttribute('aria-expanded', 'false');
                btn.title = '説明を展開/折りたたむ';
                btn.textContent = '+'; // initial collapsed state
          }
                btn.addEventListener('click', function () {
                  const expanded = btn.getAttribute('aria-expanded') === 'true';
                  if (expanded) {
                    // collapse
                    if (desc) desc.style.display = 'none';
                    btn.setAttribute('aria-expanded', 'false');
                    btn.textContent = '+';
                    card.classList.add('collapsed');
                  } else {
                    // expand
                    if (desc) desc.style.display = '';
                    btn.setAttribute('aria-expanded', 'true');
                    btn.textContent = '−';
                    card.classList.remove('collapsed');
                  }
                });
        });

        // Insert header before title and move title into header
        title.parentNode.insertBefore(header, title);
        header.appendChild(btn);
        header.appendChild(title);

        // set initial collapsed state (hide description and shrink card)
        if (desc) desc.style.display = 'none';
        card.classList.add('collapsed');
      }
    });
  } catch (e) {
    console.error('initProjectTagsAndToggles failed', e);
  }
}

// Run initProjectTagsAndToggles on DOM ready (safe if DOM already parsed)
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  setTimeout(initProjectTagsAndToggles, 40);
} else {
  document.addEventListener('DOMContentLoaded', initProjectTagsAndToggles);
}

/* CSV-driven project import removed — static project cards only. */

// DOM ready: attach menu toggle and load YAML content
document.addEventListener('DOMContentLoaded', function () {
  const menuBtn = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('show');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target) && nav.classList.contains('show')) {
        nav.classList.remove('show');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  // Initialize tabs/print handlers (ensure timetable tabs work on pages without contentArea)
  initTabsAndPrint();

  // Initialize project filters (projects page)
  initProjectFilters();

  // If page already contains static content (we inlined YAML), skip remote fetch
  const contentArea = document.getElementById('contentArea');
  if (contentArea && contentArea.innerHTML && contentArea.innerHTML.trim() !== '') {
    // initialize hero from window globals if provided
    try {
      const heroTitleEl = document.querySelector('.hero-title');
      const heroSubEl = document.querySelector('.hero-sub');
      const heroBtn = document.querySelector('.hero .button');
      const countdownEl = document.getElementById('countdown');

      if (window.__heroTitle && heroTitleEl) heroTitleEl.textContent = window.__heroTitle;
      if (window.__heroSubtitle && heroSubEl) heroSubEl.textContent = window.__heroSubtitle;
      if (window.__heroCta && heroBtn) {
        heroBtn.textContent = window.__heroCta.text || heroBtn.textContent;
        heroBtn.setAttribute('href', window.__heroCta.url || heroBtn.getAttribute('href'));
      }
      if (window.__heroDate) {
        let parsed = new Date(window.__heroDate);
        if (isNaN(parsed)) parsed = new Date(window.__heroDate + 'Z');
        target = parsed;
        if (target && countdownEl) updateCountdown();
        if (target) setInterval(updateCountdown, 1000);
      }
      // set footer year
      const yearEl = document.getElementById('currentYear'); if (yearEl) yearEl.textContent = new Date().getFullYear();
    } catch (e) { console.error('init static content failed', e); }
    // initialize scroll background overlay behavior
    initScrollBackground();

    // start flip-style countdown animation then switch to digital (if target set)
    try {
      const countdownEl = document.getElementById('countdown');
      if (countdownEl && target) animateCountUp(countdownEl, target);
    } catch (e) {}

    return; // skip fetch since content already embedded
  }

  // fetch YAML content file
  fetch('assets/content.yml')
    .then(function (res) { return res.text(); })
    .then(function (text) {
      try {
        const data = jsyaml.load(text);

        // hero
        if (data && data.hero) {
          const heroTitleEl = document.querySelector('.hero-title');
          const heroSubEl = document.querySelector('.hero-sub');
          const heroBtn = document.querySelector('.hero .button');
          const countdownEl = document.getElementById('countdown');

          if (data.hero.title && heroTitleEl) heroTitleEl.textContent = data.hero.title;
          if (data.hero.subtitle && heroSubEl) heroSubEl.textContent = data.hero.subtitle;
          if (data.hero.cta && heroBtn) {
            heroBtn.textContent = data.hero.cta.text || heroBtn.textContent;
            heroBtn.setAttribute('href', data.hero.cta.url || heroBtn.getAttribute('href'));
          }
          if (data.hero.date) {
            let parsed = new Date(data.hero.date);
            if (isNaN(parsed)) {
              parsed = new Date(data.hero.date + 'Z');
            }
            target = parsed;
            if (target && countdownEl) updateCountdown();
          }
        }

        // cards
        const contentArea = document.getElementById('contentArea');
        if (contentArea && data && Array.isArray(data.cards)) {
          contentArea.innerHTML = '';
          data.cards.forEach(function (card) {
            const node = renderCard(card);
            if (node) contentArea.appendChild(node);
          });
        }

        // projects (projects.html)
        const projectsGrid = document.getElementById('projectsGrid');
        if (projectsGrid && data && Array.isArray(data.projects)) {
          projectsGrid.innerHTML = '';
          data.projects.forEach(function (p) {
            const section = document.createElement('section');
            section.className = 'card project-card';
            if (p.tags) section.setAttribute('data-tags', p.tags);
            const h3 = document.createElement('h3'); h3.textContent = p.title || '';
            const pEl = document.createElement('p'); pEl.textContent = p.description || '';
            section.appendChild(h3); section.appendChild(pEl);
            projectsGrid.appendChild(section);
          });
        }

        // timetable (timetable.html)
        const timetableList = document.getElementById('timetableList');
        if (timetableList && data && Array.isArray(data.timetable)) {
          timetableList.innerHTML = '';
          data.timetable.forEach(function (ev) {
            const li = document.createElement('li');
            li.textContent = (ev.time ? (ev.time + ' ') : '') + (ev.title || '');
            timetableList.appendChild(li);
          });
        }

        // social links (footer)
        if (data && data.social && data.social.instagram) {
          const containers = document.querySelectorAll('#footerSocial');
          containers.forEach(function (cont) {
            cont.innerHTML = '';
            const a = document.createElement('a');
            a.href = data.social.instagram;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'social-link';
            a.title = 'Instagram';

            // simple Instagram SVG icon (small)
            a.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
              + '<rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor"/>'
              + '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="white" opacity="0.95"/>'
              + '<circle cx="17.5" cy="6.5" r="1" fill="white" opacity="0.95"/>'
              + '</svg>';

            cont.appendChild(a);
          });
        }

        // start countdown ticker if target was set
        if (target) {
          setInterval(updateCountdown, 1000);
        }

        // set footer year to current year
        const yearEl = document.getElementById('currentYear');
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        // initialize scroll background overlay behavior after content is rendered
        initScrollBackground();

        // start flip-style countdown animation then switch to digital (if target set)
        try {
          const countdownEl = document.getElementById('countdown');
          if (countdownEl && target) animateCountUp(countdownEl, target);
        } catch (e) {}

            

      } catch (e) {
        console.error('YAML parse error', e);
      }
    }).catch(function (err) {
      console.error('Failed to load content.yml', err);
      // show helpful message in page when fetch fails (common when opening via file://)
      const contentArea = document.getElementById('contentArea');
      if (contentArea) {
        contentArea.innerHTML = '';
        const msg = document.createElement('section');
        msg.className = 'card no-data-error';
        const h2 = document.createElement('h2');
        h2.textContent = 'コンテンツを読み込めません';
        const p = document.createElement('p');
        p.innerHTML = 'ローカルでファイルを直接開いている場合、ブラウザのセキュリティ（CORS）によりコンテンツの読み込みがブロックされることがあります。簡単に確認するには、ワークスペースのルートでローカルサーバーを起動してください。';
        const pre = document.createElement('pre');
        pre.textContent = 'python -m http.server 8000';
        const p2 = document.createElement('p');
        p2.innerHTML = 'その後、ブラウザで <a href="http://localhost:8000" target="_blank" rel="noopener">http://localhost:8000</a> を開いてください。';
        msg.appendChild(h2);
        msg.appendChild(p);
        msg.appendChild(pre);
        msg.appendChild(p2);
        contentArea.appendChild(msg);
      }
    });
});
