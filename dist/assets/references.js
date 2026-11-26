const cards = [...document.querySelectorAll('[data-reference]')];
const viewer = document.querySelector('#reference-viewer');
const fullImage = document.querySelector('#reference-full-image');
const viewport = document.querySelector('#reference-viewport');
const title = document.querySelector('#reference-viewer-title');
const meta = document.querySelector('#reference-viewer-meta');
const position = document.querySelector('#reference-position');
const zoomButton = document.querySelector('[data-reference-zoom]');
const originalLink = document.querySelector('#reference-original-link');
const loadState = document.querySelector('#reference-load-state');
let current = 0;
let trigger = null;

function setZoom(zoomed) {
  viewport.classList.toggle('is-zoomed', zoomed);
  zoomButton.setAttribute('aria-pressed', String(zoomed));
  zoomButton.textContent = zoomed ? 'Kicsinyítés' : 'Nagyítás';
  viewport.scrollTo(0, 0);
}

function showReference(index) {
  current = (index + cards.length) % cards.length;
  const card = cards[current];
  setZoom(false);
  title.textContent = card.dataset.title;
  meta.textContent = card.dataset.kind;
  position.textContent = `${current + 1} / ${cards.length}`;
  originalLink.href = card.href;
  fullImage.alt = card.dataset.title;
  fullImage.width = Number(card.dataset.width);
  fullImage.height = Number(card.dataset.height);
  viewport.classList.add('is-loading');
  loadState.textContent = 'Kép betöltése…';
  zoomButton.disabled = true;
  fullImage.src = card.href;
}

fullImage.addEventListener('load', () => {
  if (!viewer.open) return;
  viewport.classList.remove('is-loading');
  loadState.textContent = '';
  zoomButton.disabled = false;
});
fullImage.addEventListener('error', () => {
  if (!viewer.open) return;
  loadState.textContent = 'A kép nem töltődött be. Próbáld újra, vagy nyisd meg külön.';
  viewport.classList.remove('is-loading');
});

cards.forEach((card, index) => card.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !viewer.showModal) return;
  event.preventDefault();
  trigger = card;
  viewer.showModal();
  document.body.classList.add('reference-viewer-open');
  showReference(index);
}));

document.querySelector('[data-reference-close]').addEventListener('click', () => viewer.close());
document.querySelector('[data-reference-previous]').addEventListener('click', () => showReference(current - 1));
document.querySelector('[data-reference-next]').addEventListener('click', () => showReference(current + 1));
zoomButton.addEventListener('click', () => setZoom(zoomButton.getAttribute('aria-pressed') !== 'true'));
fullImage.addEventListener('click', () => {
  if (!zoomButton.disabled) setZoom(zoomButton.getAttribute('aria-pressed') !== 'true');
});
viewer.addEventListener('keydown', event => {
  if (zoomButton.getAttribute('aria-pressed') === 'true') return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showReference(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const box = viewer.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) viewer.close();
});
viewer.addEventListener('close', () => {
  document.body.classList.remove('reference-viewer-open');
  setZoom(false);
  if (trigger?.isConnected) trigger.focus({preventScroll: true});
});
