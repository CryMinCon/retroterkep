import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const pages=['index.html','koszonjuk.html','404.html','mukodes/index.html'];
for(const page of pages){
  const source=fs.readFileSync(path.join(dist,page),'utf8');
  const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length,`${page}: duplicate IDs`);
  for(const [,url] of source.matchAll(/\b(?:src|href)="([^"]+)"/g)){
    if(/^(?:https?:|mailto:|tel:|data:)/.test(url)) continue;
    if(url.startsWith('#')){assert(ids.includes(url.slice(1)),`${page}: missing anchor ${url}`);continue;}
    const file=url.split(/[?#]/)[0];
    assert(fs.existsSync(path.join(dist,file==='/'?'index.html':file)),`${page}: missing asset ${url}`);
  }
}
const protectedCopy=[
 'A jó emlék nem megy ki a divatból.',
 'Mindhárom grafika bemutató, nem valós ügyfélreferencia.',
 'Az ajánlat 500 darabos minimum mennyiséget jelöl, amely több megrendelő között is megosztható.',
 'Az előlapi megjelenés lehetőségeit külön egyeztetjük.',
 'A hátoldali grafika a cég arculatához és az egyeztetett elképzelésekhez igazodik.',
 'A gyártási határidő és a szállítás módja egyedi egyeztetést igényel.'
];
for(const sentence of protectedCopy)assert(html.includes(sentence),`Business fact or preserved copy is missing: ${sentence}`);
assert(!/Úton vagyunk|DEMO \/ KONCEPCIÓ|Nem élesített honlap/.test(html),'Old brand or concept labels remain');
assert(html.includes('name="retroterkep-ajanlat"')&&html.includes('data-netlify="true"')&&html.includes('name="form-name" value="retroterkep-ajanlat"'),'Netlify form declaration missing');
for(const file of ['app.js','pricing.js']){
 const result=spawnSync(process.execPath,['--check',path.join(dist,'assets',file)],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
}
for(const file of ['robots.txt','sitemap.xml','assets/reklamhatoldalak.pdf'])assert(fs.existsSync(path.join(dist,file)),`Missing ${file}`);
const css=fs.readFileSync(path.join(dist,'assets/style.css'),'utf8');
for(const [,url] of css.matchAll(/url\('([^']+)'\)/g)){
 if(!url.startsWith('data:'))assert(fs.existsSync(path.join(dist,url)),`Missing CSS asset ${url}`);
}
console.log('OK: business facts, local assets, navigation, Netlify form and JavaScript syntax.');
