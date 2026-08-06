# RTW Digital Catalogue

Catalogo web statico dei prodotti **RTW (Ready-To-Wear)** disponibili nelle boutique EU,
pensato per essere condiviso con clienti selezionati e usato come riferimento per i
**transfer store-to-store**.

Per ogni articolo mostra foto, SKU, categoria e colore. **Non** espone taglie, quantità
né ubicazione dei pezzi.

> **Riservato / interno.** Il sito è marcato `noindex, nofollow` e il footer riporta
> "Confidential internal catalogue". Non pubblicare su domini pubblici senza protezione.

## Contenuto del repository

```
rtw-digital-catalogue/
├─ index.html      # markup della pagina (header, toolbar filtri, griglia, lightbox)
├─ styles.css      # stili
├─ app.js          # logica: filtri, rendering incrementale, lightbox/galleria
├─ data.js         # catalogo prodotti (window.CATALOG) — generato
├─ logo.svg        # logo Valentino
├─ fonts/          # DINPro-Medium.ttf
└─ images/         # foto di fallback per i prodotti senza media sul DAM
   ├─ men/
   └─ women/
```

Il sito è **completamente statico**: HTML + CSS + JavaScript vanilla, nessuna dipendenza
né build step. `data.js` definisce `window.CATALOG` come array di prodotti; ogni prodotto
ha campi come `gender`, `category`, `sku`, `color`, `img` e `gallery`.

## Funzionalità

- Griglia responsive dei prodotti (prima Donna, poi Uomo).
- Filtro **Men / Women / All** e filtro per **categoria** (le categorie si aggiornano in
  base al genere selezionato).
- **Lightbox** con galleria di scatti per prodotto (frontale come immagine principale),
  navigazione con frecce/tastiera e miniature.
- Rendering incrementale con **infinite scroll** e **lazy-loading** delle immagini
  (fluido anche con oltre mille prodotti).
- Lista di esclusione interna (`EXCLUDE` in `app.js`) e filtro automatico dei prodotti
  senza immagine.

## Immagini prodotto

Le immagini in alta risoluzione arrivano dal **DAM Valentino** (Content Hub API) e vengono
**referenziate** tramite URL pubblico del CDN — non vengono scaricate nel repo, così resta
leggero. I prodotti senza media sul DAM usano come fallback le foto in `images/`.

## Anteprima locale

Essendo statico basta un qualsiasi web server. Con Python:

```bash
python -m http.server 8099
# apri http://localhost:8099
```

> Aprire `index.html` con doppio clic (`file://`) può funzionare, ma un server locale è
> consigliato per il corretto caricamento di `data.js` e delle risorse.

## Aggiornare il catalogo

`data.js` è un artefatto generato a partire dai file Excel sorgente (disponibilità EU RTW)
e dal DAM tramite gli script Python `build_catalog.py` e `build_dam_images.py` (mantenuti
fuori da questo repository, nel progetto di origine). Per aggiornare il catalogo si
rigenera `data.js` e lo si sostituisce qui.

## Deploy

Trattandosi di dati riservati, si consiglia una distribuzione **protetta da password**
(es. S3 privato + CloudFront con Basic Auth, o equivalente aziendale). Caricare l'intero
contenuto di questa cartella come sito statico.
