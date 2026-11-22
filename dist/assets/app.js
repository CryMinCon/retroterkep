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
  openDialog(quoteDialog, trigger);
}));
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

// Complete, shareable logo catalogue; no customer data is stored.
import {logoConcepts, logoGroups} from './logos/catalog.js?v=20261122-osszes-logo';
const logoButtons = document.querySelectorAll('[data-logo-option]');
const logoVariant = document.querySelector('#logo-variant');
let selectedLogoKey = '07';
function selectLogo(key, updateUrl = false) {
  if (!Object.hasOwn(logoConcepts, key)) key = Object.hasOwn(logoGroups, key) ? Object.keys(logoConcepts).find(id => logoConcepts[id].group === key) : '07';
  const concept = logoConcepts[key];
  selectedLogoKey = key;
  document.documentElement.classList.toggle('badge-logo-preview', ['oval', 'circle', 'map-oval', 'map-circle'].includes(concept.form));
  document.querySelectorAll('[data-logo-artwork]').forEach(artwork => {
    artwork.className = `logo-artwork logo-artwork--${key}`;
    const image = artwork.querySelector('img');
    image.width = concept.width;
    image.height = concept.height;
    image.alt = `retroterkep – ${concept.name} logó`;
    image.src = concept.src;
  });
  logoButtons.forEach(button => {
    const active = button.dataset.logoOption === concept.group;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const variants = Object.entries(logoConcepts).filter(([,entry]) => entry.group === concept.group);
  logoVariant.replaceChildren(...variants.map(([id,entry]) => new Option(entry.name.split(' · ').slice(2).join(' · ') || 'Szabadforma', id)));
  logoVariant.value = key;
  logoVariant.closest('.logo-variant-field').hidden = variants.length < 2;
  document.querySelector('#logo-current').textContent = `Kiválasztva: ${concept.name}`;
  const url = new URL(window.location.href);
  url.searchParams.set('logo', key);
  document.querySelector('#logo-version-link').href = `${url.pathname}${url.search}#logok`;
  if (updateUrl) window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}
logoButtons.forEach(button => button.addEventListener('click', () => {
  const group = button.dataset.logoOption;
  const form = logoConcepts[selectedLogoKey].form;
  const match = Object.keys(logoConcepts).find(id => logoConcepts[id].group === group && logoConcepts[id].form === form)
    || Object.keys(logoConcepts).find(id => logoConcepts[id].group === group);
  selectLogo(match, true);
}));
logoVariant.addEventListener('change', () => selectLogo(logoVariant.value, true));
selectLogo(new URL(window.location.href).searchParams.get('logo'));
window.addEventListener('popstate', () => selectLogo(new URL(window.location.href).searchParams.get('logo')));
