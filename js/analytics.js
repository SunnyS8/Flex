const CONFIG = {
  yandexMetrikaCounterId: '',
  ga4MeasurementId: '',
};

function loadYandexMetrika(id) {
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  window.ym(Number(id), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
}

function loadGA4(gaId) {
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', gaId, { send_page_view: true });
}

function getUtm() {
  const p = new URLSearchParams(location.search);
  const out = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
    if (p.has(k)) out[k] = p.get(k);
  });
  if (document.referrer) out.referrer = document.referrer;
  return out;
}

function track(name, params) {
  params = Object.assign({}, getUtm(), params || {});
  if (CONFIG.yandexMetrikaCounterId && window.ym) {
    try { window.ym(Number(CONFIG.yandexMetrikaCounterId), 'reachGoal', name, params); } catch (e) {}
  }
  if (CONFIG.ga4MeasurementId && window.gtag) {
    try { window.gtag('event', name, params); } catch (e) {}
  }
}

window.FlexAnalytics = { track: track };

function init() {
  if (CONFIG.yandexMetrikaCounterId) loadYandexMetrika(CONFIG.yandexMetrikaCounterId);
  if (CONFIG.ga4MeasurementId) loadGA4(CONFIG.ga4MeasurementId);

  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.indexOf('t.me/SashaShyman') > -1 || href.indexOf('mailto:') > -1) {
      track('lead_click', { where: href.indexOf('mailto:') > -1 ? 'email' : 'telegram' });
    } else if (href.indexOf('potolok-party.vercel.app') > -1) {
      track('open_calculator');
    } else if (href.indexOf('t.me/STrenerS_bot') > -1) {
      track('open_bot');
    }
  });

  const marks = [25, 50, 75, 100];
  const fired = {};
  window.addEventListener('scroll', function () {
    const h = document.documentElement;
    const scrolled = ((h.scrollTop || document.body.scrollTop) + window.innerHeight) / h.scrollHeight * 100;
    marks.forEach(function (m) {
      if (!fired[m] && scrolled >= m) { fired[m] = true; track('scroll_depth', { percent: m }); }
    });
  }, { passive: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
