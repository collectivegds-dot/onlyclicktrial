/**
 * ONLYCLICK DOM Patcher v1.9.1
 * 1. Replaces Qlipper branding → ONLYCLICK
 * 2. Shows Instagram popup on first load
 * 3. Shows License Key popup with Email activation
 * 4. Silently verifies license against Vercel API
 * 5. Hides update section / external links
 */
(function () {
  'use strict';

  const APP_NAME = 'ONLYCLICK';
  const API_URL  = 'https://onlyclick-license.vercel.app';
  const IG_URL   = 'https://www.instagram.com/monvelo_garage?igsh=cTR3d2trdmJtNzY3&utm_source=qr';
  
  const LIC_KEY         = 'onlyclick_license_key';
  const LIC_EMAIL       = 'onlyclick_license_email';
  const LIC_FINGERPRINT = 'onlyclick_license_fingerprint';
  const LIC_OK          = 'onlyclick_license_ok';
  const IG_DONE         = 'onlyclick_ig_done';

  /* ── Fingerprinting ── */
  function getFingerprint() {
    let f = localStorage.getItem(LIC_FINGERPRINT);
    if (!f) {
      const parts = [
        navigator.userAgent,
        screen.width,
        screen.height,
        Math.random().toString(36).substring(2, 15)
      ].join('|');
      // Simple hash-like string
      f = 'OC-' + btoa(parts).substring(0, 16).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      localStorage.setItem(LIC_FINGERPRINT, f);
    }
    return f;
  }

  /* ── Branding ── */
  function patchTextNodes(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const arr = []; let n;
    while ((n = w.nextNode())) { if (/qlipper/i.test(n.textContent)) arr.push(n); }
    arr.forEach(n => {
      n.textContent = n.textContent.replace(/qlipper ai/gi, APP_NAME).replace(/qlipper/gi, APP_NAME);
    });
  }
  function patchLogos(root) {
    root.querySelectorAll('img[src*="qlipper"], img[alt*="lipper"], img[src*="logo-dark"], img[src*="logo-light"]').forEach(img => {
      const b = document.createElement('span');
      b.className = 'oc-logo-badge'; b.textContent = 'OC'; b.title = APP_NAME;
      img.parentNode.replaceChild(b, img);
    });
  }
  function patchTitle() {
    if (document.title.toLowerCase().includes('qlipper')) document.title = APP_NAME;
  }

  /* ── Hide update / external links ── */
  function hideUpdateSection() {
    document.querySelectorAll('a').forEach(a => {
      const h = (a.getAttribute('href') || '').toLowerCase();
      if (h.includes('qlipper.') || h.includes('update') && !h.includes('ytdlp')) {
        const p = a.closest('div, section, footer, aside');
        if (p && p.textContent.length < 300) p.style.display = 'none';
        else a.style.display = 'none';
      }
    });
    document.querySelectorAll('footer, [class*="footer"], [class*="update-banner"]').forEach(el => {
      const t = (el.textContent || '').toLowerCase();
      if (t.includes('update available') || t.includes('new version') || (t.includes('qlipper') && !t.includes('onlyclick'))) {
        el.style.display = 'none';
      }
    });
  }

  function patch() {
    patchTitle(); patchTextNodes(document.body); patchLogos(document.body); hideUpdateSection();
  }

  /* ── Instagram Popup ── */
  function showIgPopup() {
    if (localStorage.getItem(IG_DONE) === '1') { checkLicense(); return; }
    const o = document.createElement('div'); o.id = 'oc-ig-overlay';
    o.innerHTML = `
      <div class="oc-popup-card">
        <div class="oc-popup-icon" style="background:linear-gradient(135deg,#E1306C,#F77737,#FCAF45)">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </div>
        <h3 class="oc-popup-title">Follow Us on Instagram!</h3>
        <p class="oc-popup-desc">Ikuti kami untuk update fitur terbaru, tips konten, dan tutorial ONLYCLICK.</p>
        <a href="${IG_URL}" target="_blank" rel="noopener" class="oc-popup-btn oc-btn-ig">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          @monvelo_garage
        </a>
        <button class="oc-popup-btn oc-btn-secondary" id="oc-ig-next">Lanjutkan →</button>
        <label class="oc-popup-check"><input type="checkbox" id="oc-ig-save"> Jangan tampilkan lagi</label>
      </div>`;
    document.body.appendChild(o);
    requestAnimationFrame(() => o.classList.add('oc-popup-visible'));
    document.getElementById('oc-ig-next').onclick = () => {
      if (document.getElementById('oc-ig-save')?.checked) localStorage.setItem(IG_DONE, '1');
      o.classList.remove('oc-popup-visible');
      setTimeout(() => { o.remove(); checkLicense(); }, 300);
    };
  }

  /* ── License System ── */
  
  async function verifyLicenseSilent() {
    const key = localStorage.getItem(LIC_KEY);
    const email = localStorage.getItem(LIC_EMAIL);
    if (!key || !email) return false;

    try {
      const res = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, email, fingerprint: getFingerprint() })
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem(LIC_OK, '1');
        return true;
      }
    } catch (e) {
      console.error('[LIC] Verification failed, server down?', e);
      // If server is down, allow usage if it was previously OK
      return localStorage.getItem(LIC_OK) === '1';
    }
    localStorage.removeItem(LIC_OK);
    return false;
  }

  async function checkLicense() {
    const isOk = await verifyLicenseSilent();
    if (!isOk) showLicensePopup();
  }

  function showLicensePopup() {
    if (document.getElementById('oc-lic-overlay')) return;
    const o = document.createElement('div'); o.id = 'oc-lic-overlay';
    o.innerHTML = `
      <div class="oc-popup-card">
        <div class="oc-popup-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>
        </div>
        <h3 class="oc-popup-title">Aktivasi ONLYCLICK</h3>
        <p class="oc-popup-desc">Masukkan email yang terdaftar untuk mengaktifkan lisensi Anda di perangkat ini.</p>
        <div class="oc-lic-wrap">
          <input type="email" id="oc-lic-email" class="oc-lic-input" placeholder="Email Terdaftar" required style="margin-bottom:12px"/>
        </div>
        <div id="oc-lic-err" class="oc-lic-err" style="display:none"></div>
        <button class="oc-popup-btn oc-btn-primary" id="oc-lic-go">🚀 Aktifkan Sekarang</button>
        <p class="oc-popup-hint">Lisensi akan otomatis dibuat jika email Anda sudah didaftarkan oleh admin.</p>
      </div>`;
    document.body.appendChild(o);
    requestAnimationFrame(() => o.classList.add('oc-popup-visible'));
    
    const emailInp = document.getElementById('oc-lic-email');
    const err = document.getElementById('oc-lic-err');
    const btn = document.getElementById('oc-lic-go');

    btn.onclick = async () => {
      const email = emailInp.value.trim();
      if (!email || !email.includes('@')) {
        err.textContent = 'Silakan masukkan email yang valid.';
        err.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Memproses...';
      err.style.display = 'none';

      try {
        // 1. Activate (Generate key)
        const actRes = await fetch(`${API_URL}/api/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const actData = await actRes.json();

        if (!actData.success) {
          throw new Error(actData.reason || 'Email belum terdaftar.');
        }

        const key = actData.key;

        // 2. Verify (Bind device)
        const verRes = await fetch(`${API_URL}/api/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, email, fingerprint: getFingerprint() })
        });
        const verData = await verRes.json();

        if (verData.valid) {
          localStorage.setItem(LIC_KEY, key);
          localStorage.setItem(LIC_EMAIL, email);
          localStorage.setItem(LIC_OK, '1');
          
          btn.textContent = '✓ Berhasil Diaktifkan!';
          btn.style.background = '#10b981';
          setTimeout(() => {
            o.classList.remove('oc-popup-visible');
            setTimeout(() => o.remove(), 300);
          }, 1500);
        } else {
          throw new Error(verData.reason === 'device_mismatch' ? 'Lisensi ini sudah digunakan di perangkat lain.' : 'Gagal verifikasi lisensi.');
        }
      } catch (e) {
        err.textContent = e.message;
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '🚀 Aktifkan Sekarang';
      }
    };
  }

  /* ── Init ── */
  function init() {
    patch();
    setTimeout(showIgPopup, 1500);

    const obs = new MutationObserver(muts => {
      let dirty = false;
      muts.forEach(m => {
        m.addedNodes.forEach(n => { if (n.nodeType === 1) dirty = true; });
        if (m.type === 'characterData' && /qlipper/i.test(m.target.textContent)) dirty = true;
      });
      if (dirty) patch();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 50);
})();

