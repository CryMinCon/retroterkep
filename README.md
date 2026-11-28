# retrótérkép.hu

A retroterkep.hu statikus honlapjának forrása. A megjelenés és a szövegezés a jóváhagyott 03 – Pop és Poszt változatot követi. Márkanév és logó: **retrótérkép.hu**. A domain ékezet nélkül: **retroterkep.hu**.

## Ellenőrzés

Node.js 20 vagy újabb szükséges, külső csomagtelepítés nélkül.

```sh
npm run build
npm test
```

A weboldal a `dist/` könyvtárban található. A `scripts/check.mjs` a helyi hivatkozásokat, képeket, betűkészleteket, a jóváhagyott szöveget és az űrlap deklarációját ellenőrzi. A kalkulátor tesztje az eredeti ajánlat ársávhatárait és a bruttó összegeket vizsgálja.

## GitHub → Netlify

1. A Netlifyban importáld a `CryMinCon/retroterkep` repót, `main` ágról.
2. Build command: `node scripts/check.mjs`. Publish directory: `dist`. A `netlify.toml` tartalmazza ezeket.
3. A Forms résznél engedélyezd a form detection funkciót, majd indíts új deployt. A statikus HTML-ben deklarált űrlap neve `retroterkep-ajanlat`.
4. Az űrlapértesítés címzettjét a Netlifyban állítsd `faragoerno60@gmail.com` címre. Ez nem állítható be pusztán az oldalon szereplő e-mail-címmel.
5. A Netlify domainkezelésében add hozzá a `retroterkep.hu` és `www.retroterkep.hu` domaineket. Kizárólag a tényleges Netlify-projekt által visszaadott DNS-értékeket használd. A fő domain `retroterkep.hu`.
6. Ellenőrizd a HTTPS-t és az űrlap feldolgozását.

Az új kérések nem e-mailes hírlevél-feliratkozások. Az oldal nem tartalmaz látogatásmérő vagy hirdetési követőkódot, a betűkészletek helyben vannak. A cégnév-előnézet csak a böngészőben módosítja a mintát.

## Tartalom és élesítési állapot

- Eredeti térképkép: a rendelkezésre bocsátott termékismertetőből, képarányát megtartva.
- Korabeli reklámhátoldalak: nagyítható képgalériában. A korábbi PDF-letöltés eltávolítva.
- A bemutató hátoldali grafikák nem ügyfélreferenciák.
- Az egységárak és fizetési feltételek a jóváhagyott 03-as anyagban szereplő eredeti ajánlatból származnak.
- Az űrlaphoz hibaüzenet és e-mailes folytatás tartozik, a sikeroldalt csak sikeres kiszolgálói válasz után nyitja meg a JavaScript.
- A Netlify-projekt, form detection, értesítési cím, domain és DNS beállítása a tényleges fiókban szükséges; a forrás megléte nem igazolja az éles publikálást vagy az ajánlatkérés kézbesítését.
- A teljes cégazonosító és adatkezelési adatokhoz az üzemeltető megerősített adatai szükségesek; a forrás nem talál ki székhelyet, adószámot, cégjegyzékszámot vagy adatmegőrzési időt.

## Betűkészletek

Open Sans (400, 600, 800), valamint URW P052 Italic. A mellékelt fontlicencek az `dist/assets/fonts/` könyvtárban találhatók. A logó vektoros körvonalakat használ.

## Ellenőrzött működés – 2026. november 19.

- A buildellenőrzés és az ársávok három automatizált tesztje sikeres.
- Asztali előnézetben minden kép betöltött, oldalirányú túllógás nélkül.
- 345, 375 és 753 CSS-pixel szélességnél nem volt oldalirányú túllógás. A mobilmenü megnyílt.
- Az ajánlatkérő átvette a kiválasztott mennyiséget. A beágyazott adatkezelési ablak bezárása után az ajánlatkérő nyitva maradt, és a görgetés zárolása helyesen állt vissza.
- A cégnév-előnézet és a hátoldali minták váltása működött.
- Tényleges ajánlatkérés nem került elküldésre. Az éles Netlify-kézbesítés, e-mail-értesítés, domain és HTTPS még nincs igazolva.


## Nagyítós működési bemutató

A főoldal és a `/mukodes/` oldal ugyanazt a 26 másodperces MP4-et használja. A nagyító az eredeti réteges térkép részletét nagyítja, nem külön ráírt számokat. Egyetlen közös betétlap hordozza a Kecskemét feliratot és az öt megadott bemutatóértéket; a többi nyílás üres.

Újrarenderelés: `python scripts/render-demo.py` (Pillow és ffmpeg szükséges). A `--stills` kapcsoló csak az ellenőrző képeket és a posztert készíti el. A forrás a `scripts/demo-assets/` mappában van. A régi videó közvetlen hivatkozásokhoz megmarad.

A nagyító mozgatása közben nincs célváros- és km-kiírás: az csak a megállás után jelenik meg. A szinkron ellenőrzése: `python scripts/demo.test.py`.
