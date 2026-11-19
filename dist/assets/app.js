import {calculatePrice, MIN_QUANTITY, MAX_QUANTITY} from './pricing.js';

const number = new Intl.NumberFormat('hu-HU');
const quantity = document.querySelector('#quantity');
const range = document.querySelector('#quantity-range');
const minus = document.querySelector('#quantity-minus');
const plus = document.querySelector('#quantity-plus');
let selectedQuantity = MIN_QUANTITY;

function setQuantity(value) {
  const candidate = Number(value);
  const count = Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, Number.isFinite(candidate) ? Math.round(candidate) : MIN_QUANTITY));
  const price = calculatePrice(count);
  selectedQuantity = count;
  quantity.value = String(count);
  range.value = String(count);
  document.querySelector('#example-label').textContent = `PÉLDA: ${number.format(count)} DARAB`;
  document.querySelector('#price-net').textContent = number.format(price.net);
  document.querySelector('#price-gross').textContent = number.format(price.gross);
  document.querySelector('#price-unit').textContent = number.format(price.unit);
  document.querySelectorAll('[data-price-tier]').forEach(row => row.classList.toggle('active', Number(row.dataset.priceTier) === price.tier));
  minus.disabled = count === MIN_QUANTITY;
  plus.disabled = count === MAX_QUANTITY;
}
quantity.addEventListener('input', () => {
  const count = Number(quantity.value);
  if (quantity.value && Number.isInteger(count) && count >= MIN_QUANTITY && count <= MAX_QUANTITY) setQuantity(count);
});
quantity.addEventListener('change', () => setQuantity(quantity.value));
range.addEventListener('input', () => setQuantity(range.value));
minus.addEventListener('click', () => setQuantity(selectedQuantity - 100));
plus.addEventListener('click', () => setQuantity(selectedQuantity + 100));

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() {
  nav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Menü megnyitása');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  nav.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
});
nav.querySelectorAll('a,button').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

document.querySelectorAll('button[data-face]').forEach(button => {
  button.addEventListener('click', () => {
    const front = button.dataset.face === 'front';
    document.querySelector('#hero-front').hidden = !front;
    document.querySelector('#hero-back').hidden = front;
    document.querySelectorAll('button[data-face]').forEach(control => {
      const selected = control === button;
      control.classList.toggle('selected', selected);
      control.setAttribute('aria-pressed', String(selected));
    });
  });
});

const designs = {
  transport: 'MESSZIRE<br>VISZÜNK<br>MINDENT.',
  garage: 'A JÓ ÚT<br>ITT KEZDŐDIK.',
  anniversary: '25 ÉVE<br>EGYÜTT.'
};
function setDesign(design) {
  if (!Object.hasOwn(designs, design)) return;
  const back = document.querySelector('#ad-back');
  back.dataset.design = design;
  document.querySelector('#back-slogan').innerHTML = designs[design];
  back.querySelector('.back-services').hidden = design !== 'transport';
  document.querySelectorAll('button[data-design]').forEach(button => {
    const selected = button.dataset.design === design;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
document.querySelectorAll('button[data-design]').forEach(button => button.addEventListener('click', () => setDesign(button.dataset.design)));
setDesign('transport');
const companyPreview = document.querySelector('#company-preview');
function updateCompany() {
  const company = companyPreview.value.trim() || 'SÁLAI CÉGCSOPORT';
  document.querySelectorAll('.sample-company').forEach(element => {element.textContent = company;});
}
document.querySelector('#apply-company').addEventListener('click', updateCompany);
companyPreview.addEventListener('keydown', event => {
  if (event.key === 'Enter') {event.preventDefault(); updateCompany();}
});

const quoteDialog = document.querySelector('#quote-dialog');
const privacyDialog = document.querySelector('#privacy-dialog');
const quoteQuantity = document.querySelector('#quote-quantity');
const dialogTriggers = new WeakMap();
const allDialogs = [quoteDialog, privacyDialog];
function syncDialogScroll() {document.body.style.overflow = allDialogs.some(dialog => dialog.open) ? 'hidden' : '';}
function openDialog(dialog, trigger) {
  if (dialog.open) return;
  dialogTriggers.set(dialog, trigger);
  dialog.showModal();
  syncDialogScroll();
}
document.querySelectorAll('[data-open-quote]').forEach(trigger => trigger.addEventListener('click', () => {
  if (!quoteQuantity.dataset.touched || trigger.closest('.calculator')) quoteQuantity.value = String(selectedQuantity);
  openDialog(quoteDialog, trigger);
}));
quoteQuantity.addEventListener('input', () => {quoteQuantity.dataset.touched = 'true';});
document.querySelectorAll('[data-open-privacy]').forEach(trigger => trigger.addEventListener('click', () => openDialog(privacyDialog, trigger)));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
allDialogs.forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    syncDialogScroll();
    const trigger = dialogTriggers.get(dialog);
    if (trigger?.isConnected) trigger.focus();
  });
});

const form = document.querySelector('#quote-form');
const submit = document.querySelector('#quote-submit');
const status = document.querySelector('#form-status');
const emailFallback = document.querySelector('#email-fallback');
let sending = false;
['name', 'company'].forEach(name => {
  const field = form.elements.namedItem(name);
  field.addEventListener('input', () => field.setCustomValidity(''));
  field.addEventListener('change', () => field.setCustomValidity(field.value.trim() ? '' : 'Kérjük, töltsd ki ezt a mezőt.'));
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending) return;
  ['name', 'company'].forEach(name => {
    const field = form.elements.namedItem(name);
    field.setCustomValidity(field.value.trim() ? '' : 'Kérjük, töltsd ki ezt a mezőt.');
  });
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const emailBody = [
    'Egyedi ajánlatkérés – retrótérkép.hu',
    `Név: ${formData.get('name')}`,
    `Cég: ${formData.get('company')}`,
    `E-mail: ${formData.get('email')}`,
    `Telefon: ${formData.get('phone') || '–'}`,
    `Mennyiség: ${formData.get('quantity')} db`,
    `Alkalom: ${formData.get('occasion') || '–'}`,
    '', String(formData.get('message') || '')
  ].join('\n');
  emailFallback.href = `mailto:faragoerno60@gmail.com?subject=${encodeURIComponent('Egyedi ajánlatkérés – retrótérkép.hu')}&body=${encodeURIComponent(emailBody)}`;
  sending = true;
  submit.disabled = true;
  submit.textContent = 'KÜLDÉS…';
  status.textContent = 'Ajánlatkérés küldése…';
  emailFallback.hidden = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(form.action, {
      method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(formData).toString(), signal: controller.signal
    });
    if (!response.ok) throw new Error('A kiszolgáló nem igazolta vissza az elküldést.');
    window.location.assign('/koszonjuk.html');
  } catch {
    status.textContent = 'Az elküldést nem sikerült visszaigazolni. Próbáld újra, vagy küldd el az ajánlatkérést e-mailben.';
    emailFallback.hidden = false;
    sending = false;
    submit.disabled = false;
    submit.textContent = 'AJÁNLATKÉRÉS ELKÜLDÉSE';
  } finally {clearTimeout(timeout);}
});
