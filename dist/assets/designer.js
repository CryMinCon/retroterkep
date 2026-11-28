const canvas = document.querySelector('#back-canvas');
const ctx = canvas.getContext('2d');
const preview = document.querySelector('#ad-back');
const fields = {
  company: document.querySelector('#company-preview'),
  slogan: document.querySelector('#slogan-preview'),
  services: document.querySelector('#services-preview'),
  website: document.querySelector('#website-preview'),
  phone: document.querySelector('#phone-preview')
};
const templates = {
  transport: {slogan:'MESSZIRE VISZÜNK MINDENT.',services:'Fuvarozás\nLogisztika\nRaktározás',background:'#29255c',accent:'#ffe45c',text:'#ffffff'},
  garage: {slogan:'A JÓ ÚT ITT KEZDŐDIK.',services:'Szerviz\nJavítás\nKarbantartás',background:'#ffe45c',accent:'#bb1c5c',text:'#29255c'},
  anniversary: {slogan:'25 ÉVE EGYÜTT.',services:'Köszönjük a bizalmat!\nKözös utak, közös sikerek.',background:'#bb1c5c',accent:'#ffe45c',text:'#ffffff'}
};
const initialValues = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value]));
let design = 'transport';
let mode = 'template';
let orientation = 'landscape';
const images = {logo:null,artwork:null};
const uploadVersions = {logo:0,artwork:0};

function wrappedLines(text, width, size, weight) {
  ctx.font = `${weight} ${size}px "Open Sans", Arial, sans-serif`;
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && ctx.measureText(`${line} ${word}`).width > width) {lines.push(line); line = '';}
      let piece = line ? `${line} ` : '';
      for (const char of word) {
        if (ctx.measureText(piece + char).width > width && piece) {lines.push(piece); piece = '';}
        piece += char;
      }
      line = piece;
    }
    lines.push(line);
  }
  return lines;
}
function textBlock(text, x, y, width, height, maxSize, color, weight = 800) {
  if (!text.trim()) return;
  let size = maxSize;
  let lines;
  do {
    lines = wrappedLines(text, width, size, weight);
    if (lines.length * size * 1.22 <= height) break;
    size -= 0.5;
  } while (size > 4);
  ctx.save();
  ctx.beginPath(); ctx.rect(x,y,width,height); ctx.clip();
  ctx.font = `${weight} ${size}px "Open Sans", Arial, sans-serif`;
  ctx.fillStyle = color; ctx.textBaseline = 'top';
  lines.forEach((line, i) => ctx.fillText(line,x,y + i * size * 1.22));
  ctx.restore();
}
function drawImageContained(image, x, y, width, height) {
  const scale = Math.min(width/image.naturalWidth,height/image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  ctx.drawImage(image,x+(width-w)/2,y+(height-h)/2,w,h);
}
function render() {
  const portrait = orientation === 'portrait';
  const w = portrait ? 530 : 761, h = portrait ? 761 : 530;
  canvas.width = w*2; canvas.height = h*2;
  ctx.setTransform(2,0,0,2,0,0);
  preview.dataset.orientation = orientation;
  preview.dataset.design = design;
  const company = fields.company.value.trim() || 'SÁLAI CÉGCSOPORT';
  document.querySelectorAll('.sample-company').forEach(el => {el.textContent = company;});
  const direction = portrait ? 'álló' : 'fekvő';
  canvas.setAttribute('aria-label', mode === 'artwork' ? `Saját grafika – ${direction} reklámhátoldal előnézete` : `${company} – ${direction} reklámhátoldal előnézete`);
  document.querySelector('#preview-caption').textContent = `${portrait ? 'Álló' : 'Fekvő'} elrendezés · az előlapi térkép ${portrait ? 'elforgatott ' : ''}arányaival`;
  if (mode === 'artwork') {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h);
    if (images.artwork) drawImageContained(images.artwork,0,0,w,h);
    else {
      ctx.fillStyle = '#eae3f8'; ctx.fillRect(24,24,w-48,h-48);
      textBlock('ITT A SAJÁT GRAFIKÁD HELYE',48,h*.36,w-96,h*.24,portrait ? 34 : 42,'#29255c');
      textBlock('Válassz egy képet a feltöltési ablakban!',48,h*.64,w-96,90,20,'#625c70',600);
    }
    ctx.strokeStyle = '#29255c'; ctx.lineWidth = 2; ctx.strokeRect(1,1,w-2,h-2);
    return;
  }
  const theme = templates[design];
  ctx.fillStyle = theme.background; ctx.fillRect(0,0,w,h);
  ctx.save(); ctx.globalAlpha = .09; ctx.strokeStyle = theme.text; ctx.lineWidth = 22;
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(w-140+i*54,h);ctx.lineTo(w+i*54,h-210);ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle = theme.accent; ctx.lineWidth = 2; ctx.strokeRect(18,18,w-36,h-36);
  const margin = 42;
  const logoWidth = portrait ? 104 : 118;
  if (images.logo) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(margin,margin,logoWidth,80);
    drawImageContained(images.logo,margin+7,margin+7,logoWidth-14,66);
  } else {
    ctx.fillStyle = theme.accent;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(margin+i*12,margin+12);ctx.lineTo(margin+7+i*12,margin+12);ctx.lineTo(margin+23+i*12,margin+46);ctx.lineTo(margin+16+i*12,margin+46);ctx.fill();}
  }
  const nameX = margin + (images.logo ? logoWidth+20 : 64);
  textBlock(company,nameX,margin+9,w-margin-nameX,70,portrait ? 23 : 27,theme.text);
  if (portrait) {
    textBlock(fields.slogan.value.trim(),margin,160,w-2*margin,220,47,theme.accent);
    ctx.fillStyle = theme.accent; ctx.fillRect(margin,414,54,4);
    textBlock(fields.services.value.trim(),margin,445,w-2*margin,158,24,theme.text,600);
  } else {
    textBlock(fields.slogan.value.trim(),margin,168,365,212,49,theme.accent);
    ctx.fillStyle = theme.accent; ctx.fillRect(444,170,3,200);
    textBlock(fields.services.value.trim(),473,180,w-473-margin,190,24,theme.text,600);
  }
  ctx.fillStyle = theme.accent; ctx.fillRect(margin,h-115,w-2*margin,1);
  textBlock(fields.website.value.trim(),margin,h-91,w-2*margin,32,19,theme.text,600);
  textBlock(fields.phone.value.trim(),margin,h-57,w-2*margin,26,17,theme.text,600);
}
function setDesign(value) {
  if (!Object.hasOwn(templates,value)) return;
  design = value;
  fields.slogan.value = templates[value].slogan;
  fields.services.value = templates[value].services;
  document.querySelectorAll('button[data-design]').forEach(button => {
    const selected = button.dataset.design === value;
    button.classList.toggle('selected',selected); button.setAttribute('aria-pressed',String(selected));
  });
  render();
}
function setMode(value) {
  mode = value;
  document.querySelector('#template-fields').hidden = mode !== 'template';
  document.querySelector('#artwork-fields').hidden = mode !== 'artwork';
  render();
}
function clearImage(kind) {
  uploadVersions[kind]++;
  images[kind] = null;
  document.querySelector(`#${kind}-upload`).value = '';
  const status = document.querySelector(`#${kind}-status`);
  status.textContent = kind === 'logo' ? 'Még nem választottál logót.' : 'Válassz egy képet az előnézethez!';
  status.dataset.error = 'false';
  document.querySelector(`#remove-${kind}`).hidden = true;
  render();
}
async function readImage(kind, file) {
  const version = ++uploadVersions[kind];
  const status = document.querySelector(`#${kind}-status`);
  const fail = message => {
    if (version !== uploadVersions[kind]) return;
    status.textContent = message + (images[kind] ? ' Az előző kép megmaradt.' : '');
    status.dataset.error = 'true';
    document.querySelector(`#${kind}-upload`).value = '';
  };
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {fail('PNG, JPG vagy WebP képet válassz!'); return;}
  if (file.size > 10*1024*1024) {fail('A kép legfeljebb 10 MB lehet.'); return;}
  status.textContent = 'Kép betöltése…'; status.dataset.error = 'false';
  try {
    const data = await new Promise((resolve,reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
    });
    const image = new Image(); image.src = data;
    await image.decode();
    if (version !== uploadVersions[kind]) return;
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth*image.naturalHeight > 40000000) {fail('Legfeljebb 40 megapixeles képet válassz!'); return;}
    images[kind] = image;
    status.textContent = `${file.name} · ${image.naturalWidth} × ${image.naturalHeight} px`;
    document.querySelector(`#remove-${kind}`).hidden = false;
    render();
  } catch {fail('A képet nem sikerült megnyitni. Válassz másik képfájlt!');}
}
Object.values(fields).forEach(input => input.addEventListener('input',render));
document.querySelectorAll('button[data-design]').forEach(button => button.addEventListener('click',()=>setDesign(button.dataset.design)));
document.querySelectorAll('input[name="preview-mode"]').forEach(input=>input.addEventListener('change',()=>setMode(input.value)));
document.querySelectorAll('input[name="preview-orientation"]').forEach(input=>input.addEventListener('change',()=>{orientation=input.value;render();}));
for (const kind of ['logo','artwork']) {
  document.querySelector(`#${kind}-upload`).addEventListener('change', event=>{const file=event.target.files[0];if(file)readImage(kind,file);});
  document.querySelector(`#remove-${kind}`).addEventListener('click',()=>clearImage(kind));
}
document.querySelector('#reset-preview').addEventListener('click',()=>{
  Object.entries(fields).forEach(([key,input])=>{input.value=initialValues[key];});
  clearImage('logo');clearImage('artwork');orientation='landscape';
  document.querySelector('input[name="preview-orientation"][value="landscape"]').checked=true;
  document.querySelector('input[name="preview-mode"][value="template"]').checked=true;
  setMode('template');setDesign('transport');
});
render();
document.fonts.ready.then(render);
