/**
 * Video Support widget — self-contained ES module.
 *
 * Usage (developer's page):
 *
 *   import { initVideoSupport, openVideoSupport } from './video-support.js';
 *
 *   initVideoSupport({
 *     endpoint: 'https://your-be.com/api/start-session', // required
 *     region: 'emea',
 *     destinationId: 'vvazquezICVideo',
 *     channel: 'vvazquezVideo',
 *     verticalType: 'gen',
 *     // optional look & feel:
 *     accentColor: '#00b4d8',
 *     submitText: 'Request Video Support',
 *     title: 'Video Support',
 *     subtitle: "Share your details and we'll set up a video support session with you.",
 *   });
 *
 *   // then wire it to your own button:
 *   myButton.addEventListener('click', openVideoSupport);
 *
 * Everything renders inside a Shadow DOM, so the host page's CSS can't
 * clobber it and this widget's styles can't leak out.
 */

const LOG = '[WxCC]:';

let config = null;   // resolved config from initVideoSupport()
let root = null;     // ShadowRoot
let els = null;      // cached shadow elements

const DEFAULTS = {
  endpoint: '',
  region: 'emea',
  destinationId: '',
  channel: '',
  verticalType: 'gen',
  accentColor: '#00b4d8',
  submitText: 'Request Video Support',
  title: 'Video Support',
  subtitle: "Share your details and we'll set up a video support session with you.",
};

/**
 * Initialize the widget. Call once, before openVideoSupport().
 * Returns { open } so you can also do: const vs = initVideoSupport(...); vs.open();
 */
export function initVideoSupport(userConfig = {}) {
  config = { ...DEFAULTS, ...userConfig };

  if (!config.endpoint) {
    console.warn(LOG, 'initVideoSupport called without an "endpoint"; submissions will fail.');
  }

  if (!root) {
    buildDom();
    wireEvents();
  } else {
    applyConfigToDom();
  }

  console.log(LOG, 'video support widget initialized');
  return { open: openVideoSupport, close: closeVideoSupport };
}

/** Open the modal. Wire this to your own button. */
export function openVideoSupport() {
  if (!root) {
    console.error(LOG, 'openVideoSupport called before initVideoSupport');
    return;
  }
  console.log(LOG, 'opening video support modal');
  els.overlay.classList.add('open');
  setStatus('', '');
  setTimeout(() => els.name.focus(), 50);
}

/** Close the modal. */
export function closeVideoSupport() {
  if (!root) return;
  console.log(LOG, 'closing video support modal');
  els.overlay.classList.remove('open');
}

// ---------------------------------------------------------------------------

function buildDom() {
  const host = document.createElement('div');
  host.setAttribute('data-video-support', '');
  document.body.appendChild(host);
  root = host.attachShadow({ mode: 'open' });

  root.innerHTML = `
    <style>${STYLES}</style>
    <div class="vs-overlay" part="overlay">
      <div class="vs-modal" role="dialog" aria-modal="true" aria-labelledby="vs-title">
        <button type="button" class="vs-close" aria-label="Close">&times;</button>
        <h2 id="vs-title" class="vs-title"></h2>
        <p class="vs-sub"></p>
        <form class="vs-form" novalidate>
          <div class="vs-field">
            <label for="vs-name">Name</label>
            <input type="text" id="vs-name" name="name" autocomplete="name" required>
          </div>
          <div class="vs-field">
            <label for="vs-email">Email</label>
            <input type="email" id="vs-email" name="email" autocomplete="email" required>
          </div>
          <button type="submit" class="vs-submit"></button>
          <div class="vs-status" aria-live="polite"></div>
        </form>
      </div>
    </div>
  `;

  els = {
    overlay: root.querySelector('.vs-overlay'),
    modal: root.querySelector('.vs-modal'),
    close: root.querySelector('.vs-close'),
    title: root.querySelector('.vs-title'),
    sub: root.querySelector('.vs-sub'),
    form: root.querySelector('.vs-form'),
    name: root.querySelector('#vs-name'),
    email: root.querySelector('#vs-email'),
    submit: root.querySelector('.vs-submit'),
    status: root.querySelector('.vs-status'),
  };

  applyConfigToDom();
}

function applyConfigToDom() {
  els.title.textContent = config.title;
  els.sub.textContent = config.subtitle;
  els.submit.textContent = config.submitText;
  root.host.style.setProperty('--vs-accent', config.accentColor);
}

function wireEvents() {
  els.close.addEventListener('click', closeVideoSupport);
  els.overlay.addEventListener('click', (e) => {
    if (e.target === els.overlay) closeVideoSupport();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoSupport();
  });
  els.form.addEventListener('submit', submitVideoSupport);
}

async function submitVideoSupport(e) {
  e.preventDefault();

  if (!els.form.reportValidity()) return;

  const payload = {
    name: els.name.value.trim(),
    email: els.email.value.trim(),
    verticalType: config.verticalType,
    destinationId: config.destinationId,
    channel: config.channel,
    region: config.region,
  };

  setStatus('', '');
  console.log(LOG, 'submitting video support request:', payload);

  if (!config.endpoint) {
    console.warn(LOG, 'video support endpoint not configured');
    setStatus('error', 'Support endpoint is not configured yet.');
    return;
  }

  const originalText = els.submit.textContent;
  els.submit.disabled = true;
  els.submit.textContent = 'Sending…';

  try {
    console.log(LOG, 'POST to', config.endpoint);
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    console.log(LOG, 'video support request sent, status', res.status);

    const data = await res.json();
    console.log(LOG, 'video support response:', data);

    if (!data.guestUrl) throw new Error('No guestUrl in response');

    setStatus('success', 'Thanks! Opening your video support session…');
    els.form.reset();

    console.log(LOG, 'opening guest URL:', data.guestUrl);
    window.open(data.guestUrl, '_blank', 'noopener');
  } catch (err) {
    console.error(LOG, 'video support request failed:', err);
    setStatus('error', 'Something went wrong. Please try again.');
  } finally {
    els.submit.disabled = false;
    els.submit.textContent = originalText;
  }
}

function setStatus(kind, text) {
  els.status.className = 'vs-status' + (kind ? ' ' + kind : '');
  els.status.textContent = text;
}

// ---------------------------------------------------------------------------

const STYLES = `
  :host {
    --vs-accent: #00b4d8;
    --vs-bg: #0e1730;
    --vs-bg-input: #0a0f1e;
    --vs-white: #f0f4ff;
    --vs-gray: #8b9cc8;
    --vs-border: rgba(0,180,216,0.15);
    all: initial;
  }
  * { box-sizing: border-box; }
  .vs-overlay {
    display: none; position: fixed; inset: 0; z-index: 2147483000;
    background: rgba(5,8,15,0.75); backdrop-filter: blur(4px);
    align-items: center; justify-content: center; padding: 20px;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  .vs-overlay.open { display: flex; }
  .vs-modal {
    background: var(--vs-bg); border: 1px solid var(--vs-border);
    border-radius: 14px; padding: 32px; width: 100%; max-width: 440px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5); position: relative;
    color: var(--vs-white);
  }
  .vs-title {
    font-size: 1.4rem; margin: 0 0 6px; font-weight: 700;
    color: var(--vs-accent);
  }
  .vs-sub { color: var(--vs-gray); font-size: 0.92rem; margin: 0 0 22px; }
  .vs-close {
    position: absolute; top: 16px; right: 18px; background: none; border: none;
    color: var(--vs-gray); font-size: 1.5rem; line-height: 1; cursor: pointer;
    padding: 0;
  }
  .vs-close:hover { color: var(--vs-white); }
  .vs-field { margin-bottom: 16px; }
  .vs-field label { display: block; font-size: 0.82rem; color: var(--vs-gray); margin-bottom: 6px; }
  .vs-field input {
    width: 100%; padding: 12px 14px; border-radius: 8px;
    background: var(--vs-bg-input); border: 1px solid rgba(255,255,255,0.12);
    color: var(--vs-white); font-size: 0.95rem; font-family: inherit;
    transition: border-color 0.2s;
  }
  .vs-field input:focus { outline: none; border-color: var(--vs-accent); }
  .vs-submit {
    width: 100%; margin-top: 6px; background: var(--vs-accent); color: #fff;
    padding: 14px 32px; border-radius: 8px; border: none;
    font-size: 1rem; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: filter 0.2s, transform 0.2s;
  }
  .vs-submit:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-2px); }
  .vs-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .vs-status { font-size: 0.88rem; margin-top: 14px; min-height: 1.1em; }
  .vs-status.error { color: #ff7a7a; }
  .vs-status.success { color: var(--vs-accent); }
`;
