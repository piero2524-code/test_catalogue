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
├─ index.html      # markup della pagina (header, toolbar filtri, drawer, griglia, lightbox)
├─ styles.css      # stili (restyle: DINPro + Times New Roman corsivo per il titolo editoriale)
├─ app.js          # logica: filtri, drawer, rendering incrementale, lightbox/galleria
├─ data.js         # catalogo prodotti (window.CATALOG) — generato
├─ v-logo.svg      # logo Valentino (monogramma "V") — usato anche come favicon
├─ v-favicon.png   # favicon PNG di fallback
├─ logo.svg        # vecchio logo wordmark (non più referenziato, mantenuto per storico)
├─ fonts/          # DINPro-Regular.ttf + DINPro-Medium.ttf
└─ images/         # foto di fallback per i prodotti senza media sul DAM
   ├─ men/
   └─ women/
```

Il sito è **completamente statico**: HTML + CSS + JavaScript vanilla, nessuna dipendenza
né build step. `data.js` definisce `window.CATALOG` come array di prodotti; ogni prodotto
ha campi come `gender`, `category`, `sku`, `color`, `img` e `gallery`.

## Funzionalità

- Header minimale con il **monogramma "V"** centrato e titolo editoriale
  *Ready-to-Wear Digital Catalogue* (Times New Roman corsivo).
- **Toolbar sticky che si compatta allo scroll**: il titolo scompare, restano i filtri.
- Filtro genere **All / Woman / Man** (in quest'ordine).
- **Drawer laterale "Filter by"** (scorre da destra) con sezione **Category** e sezione
  **Sizes** (entrambe **funzionanti**), e logica **Clear / Apply**. Le taglie mostrate si
  aggiornano in base al **genere** e alla **categoria** selezionata: es. scegliendo *Gowns*
  compaiono solo le taglie realmente disponibili per quella categoria (36–52), non tutte.
  Selezionando una o più taglie si filtrano i prodotti che ne hanno **almeno una**
  disponibile; le taglie deselezionate automaticamente se non più valide dopo un cambio
  categoria.
- Griglia prodotti responsive con immagini **edge-to-edge** (5 colonne desktop, 2 mobile)
  e ratio adattato agli scatti e-commerce.
- **Lightbox** con galleria di scatti (frontale come immagine principale), navigazione con
  frecce, tastiera, miniature e **swipe** su touch; mostra anche le *Available sizes* reali.
- Rendering incrementale con **infinite scroll** e **lazy-loading** delle immagini.
- Filtro automatico dei prodotti senza immagine (la lista `EXCLUDE` in `app.js` è al
  momento vuota: il catalogo è stato rigenerato da zero).

## Taglie disponibili (available sizes)

Ogni prodotto espone un array `sizes` con le **sole taglie che hanno stock** nelle boutique
EU (non si mostrano le quantità, solo la presenza). La regola, ricavata dagli Excel sorgente:

- **Donna** — foglio `FW26`, colonna **O** `SOH QTY STORE AVAILABLE`: una taglia è
  disponibile se il valore è **> 0** (la colonna non è mai vuota: `0` = niente stock).
- **Uomo** — foglio `RECAP`, solo `LINE = "M RTW"`, riga **`SOH + TRANSIT`**, colonne
  taglie **N…CK**: una taglia è disponibile se la cella è **> 0**.

I prodotti senza alcuna taglia disponibile non entrano nel catalogo.

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
