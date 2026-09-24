(function () {
  "use strict";

  // Codici da escludere dal catalogo (donna: modello senza colore = tutte le varianti;
  // uomo: SKU completo). Match per prefisso sullo SKU.
  var EXCLUDE = [
    "9B3VAH891CF", "9B3VAKS5A98", "9B3VAKM21CF", "9B3VAKM51CFNUD", "9B3VALE01ED",
    "8B0VAJY5A5Y", "8B0VAK091MM", "8B3VAHJ21MM", "8B0VAK451ED", "8B0VAK501ED",
    "7B3VAGZ71CF", "7B3VAEU91CF", "7B0VAH151ED", "7B0VAGU09SD", "4B3VA7711ED",
    "9B3VDNM51MHAD6", "9B3VDNW59A6", "9B3VDNK51MH805", "9B3VDMY02UP", "9B3VDP801ED",
    "9B3VDME61C8", "8B3VDMR61MM", "8B3VDMX01MM", "8B0VDNH51ED", "7B0VDMG51MM",
    "7B3VDLV19A6", "7B0VDMG01MM", "7B0VDM419TT", "6B3VDD9174M", "6B3VDD8674K",
    "XB0VDDH51C8", "9B3AB8M6AE8", "9B3AB8N4ABN", "8B3AB84121B", "8B0AB8E021B",
    "2B3CG3541ED", "2B3CG3M01ED", "9B3CA8D06JA", "7B3CA7K56JA", "8B3CE3Y01CF",
    "8B3CEG76A5R", "7B3CE40098T", "8B3MR01L9C5", "7B3KI05N9LV", "7B3KI05P95C",
    "7B3KI05Q9BU", "9B3KA15SAAL", "9B3KC75KAA1", "8B0KC73SA91", "8B0KD15TA75",
    "8B3KC72MA2Q", "7B3KD14H9TK", "7B3KC69M9DR", "7B3KD14G9TJ", "7B0NL00E9UW",
    "9B3RB7271CF", "9B3RB4F9AET", "9B3RB7B51MM", "9B3RB6B6AF95EA", "8B3RB7251CF",
    "8B0RB7869F3", "8B3RB7451MM", "7B3RB6451CF", "7B0RBO059UT", "8B3RF3501CF",
    "8B3RF0N89EK", "6B3RF2J01CF", "9B3RAFB01CF", "8B3RACK11CF", "8B3RACH71CF",
    "8B3RAER59WY", "9B3AEC669VQ", "8B3AEAA71MH", "8B3AEBB81MM", "7B0AEB429S9",
    "7B0AEB449QU", "6B0AEAR21MM", "9B3UHAD0AEU", "9B3UH01FAEP", "9B3KD16EADE0LY",
    "VMH04VBMDA03", "VABP83B570BO", "VAA109B57DPQ", "VRBN85AK80NO", "VRBN8625S598",
    "VRDE30ALS788", "VKC37KBCG0NO",
    "9B0AECD59Q90NO"
  ];

  function isExcluded(sku) {
    for (var i = 0; i < EXCLUDE.length; i++) {
      if (sku.indexOf(EXCLUDE[i]) === 0) return true;
    }
    return false;
  }

  // Esclude i prodotti senza immagine (ne' DAM ne' Excel) e quelli in lista di esclusione
  var ALL = (window.CATALOG || []).filter(function (p) {
    return p.img && !isExcluded(p.sku);
  });

  // Ordine: prima Donna, poi Uomo (stabile, mantiene l'ordine interno per genere)
  ALL.sort(function (a, b) {
    return (a.gender === "women" ? 0 : 1) - (b.gender === "women" ? 0 : 1);
  });
  var PAGE = 60; // prodotti per batch

  // Stato filtri
  var state = { gender: "all", category: "", sizes: [] };
  var filtered = [];
  var rendered = 0;

  // Elementi
  var grid = document.getElementById("grid");
  var genderEl = document.getElementById("genderFilter");
  var resultsInfo = document.getElementById("resultsInfo");
  var emptyEl = document.getElementById("empty");
  var sentinel = document.getElementById("sentinel");

  // Drawer "Filter by"
  var filterTrigger = document.getElementById("filterTrigger");
  var drawer = document.getElementById("filterDrawer");
  var drawerOverlay = document.getElementById("drawerOverlay");
  var drawerClose = document.getElementById("drawerClose");
  var drawerClear = document.getElementById("drawerClear");
  var drawerApply = document.getElementById("drawerApply");
  var categoryOptions = document.getElementById("categoryOptions");
  var sizeOptions = document.getElementById("sizeOptions");
  var PLACEHOLDER_CAT = "All Categories";
  var currentSizes = [];   // taglie disponibili per il gender selezionato (dinamiche)

  // Selezione temporanea nel drawer (applicata solo con "Apply")
  var draft = { category: "", sizes: [] };

  /* ---- Ordinamento taglie: numeriche crescenti, poi lettere note, poi altro ---- */
  var LETTER_ORDER = ["XXS", "XS", "S", "S/M", "M", "M/L", "L", "L/X", "L/XL",
                      "XL", "XXL", "2XL", "3XL", "XXXL", "UNI", "TU", "OS"];
  function sizeSortKey(s) {
    s = String(s).trim();
    var up = s.toUpperCase();
    var m = s.match(/^0*(\d+)/);
    if (/^0*\d+\/?$/.test(s)) return [0, parseInt(m[1], 10), 0, s];
    var li = LETTER_ORDER.indexOf(up);
    if (li !== -1) return [1, li, 0, s];
    if (m) return [0, parseInt(m[1], 10), 1, s];
    return [2, 0, 0, up];
  }
  function sortSizes(arr) {
    return arr.slice().sort(function (a, b) {
      var ka = sizeSortKey(a), kb = sizeSortKey(b);
      for (var i = 0; i < ka.length; i++) {
        if (ka[i] < kb[i]) return -1;
        if (ka[i] > kb[i]) return 1;
      }
      return 0;
    });
  }

  function fmtPrice(p) {
    if (p === null || p === undefined || p === "") return "—";
    return "€ " + Number(p).toLocaleString("en-US");
  }

  function populateSelects() {
    var pool = ALL.filter(function (p) {
      return state.gender === "all" || p.gender === state.gender;
    });
    var cats = {};
    pool.forEach(function (p) {
      if (p.category) cats[p.category] = true;
    });
    buildCategoryOptions(Object.keys(cats).sort());
    buildSizeOptions();
  }

  // Taglie disponibili per il gender corrente + (eventuale) categoria selezionata
  function computeSizes(category) {
    var set = {};
    ALL.forEach(function (p) {
      if (state.gender !== "all" && p.gender !== state.gender) return;
      if (category && p.category !== category) return;
      (p.sizes || []).forEach(function (s) { if (s) set[s] = true; });
    });
    return sortSizes(Object.keys(set));
  }

  function buildCategoryOptions(values) {
    categoryOptions.innerHTML = "";
    var all = [""].concat(values);
    all.forEach(function (v) {
      var li = document.createElement("li");
      li.className = "drawer-option";
      li.setAttribute("role", "option");
      li.setAttribute("data-value", v);
      li.textContent = v || PLACEHOLDER_CAT;
      if (v === draft.category) li.classList.add("selected");
      li.addEventListener("click", function () {
        draft.category = v;
        markCategorySelected();
        buildSizeOptions();  // auto-filtra le taglie sulla categoria scelta
      });
      categoryOptions.appendChild(li);
    });
  }

  function markCategorySelected() {
    [].forEach.call(categoryOptions.children, function (li) {
      li.classList.toggle("selected", li.getAttribute("data-value") === draft.category);
    });
  }

  function buildSizeOptions() {
    currentSizes = computeSizes(draft.category);
    // rimuovi dalla selezione le taglie non piu' disponibili nella categoria scelta
    draft.sizes = draft.sizes.filter(function (s) { return currentSizes.indexOf(s) !== -1; });
    sizeOptions.innerHTML = "";
    if (!currentSizes.length) {
      var none = document.createElement("span");
      none.className = "drawer-empty-note";
      none.textContent = "—";
      sizeOptions.appendChild(none);
      return;
    }
    currentSizes.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "size-chip";
      b.textContent = s;
      if (draft.sizes.indexOf(s) !== -1) b.classList.add("selected");
      b.addEventListener("click", function () {
        var idx = draft.sizes.indexOf(s);
        if (idx === -1) draft.sizes.push(s); else draft.sizes.splice(idx, 1);
        b.classList.toggle("selected");
      });
      sizeOptions.appendChild(b);
    });
  }

  function openDrawer() {
    // Sincronizza draft con lo stato applicato
    draft.category = state.category;
    draft.sizes = state.sizes.slice();
    markCategorySelected();
    buildSizeOptions();
    drawerOverlay.hidden = false;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    filterTrigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    filterTrigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setTimeout(function () { drawerOverlay.hidden = true; }, 300);
  }

  filterTrigger.addEventListener("click", openDrawer);
  drawerClose.addEventListener("click", closeDrawer);
  drawerOverlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
  });
  drawerApply.addEventListener("click", function () {
    state.category = draft.category;
    state.sizes = draft.sizes.slice();  // filtra per taglia disponibile (match parziale)
    updateTriggerState();
    closeDrawer();
    applyFilters();
  });
  drawerClear.addEventListener("click", function () {
    draft.category = "";
    draft.sizes = [];
    markCategorySelected();
    buildSizeOptions();
  });

  function updateTriggerState() {
    var active = !!state.category || (state.sizes && state.sizes.length);
    filterTrigger.classList.toggle("active", !!active);
  }

  function applyFilters() {
    filtered = ALL.filter(function (p) {
      if (state.gender !== "all" && p.gender !== state.gender) return false;
      if (state.category && p.category !== state.category) return false;
      if (state.sizes && state.sizes.length) {
        var ps = p.sizes || [];
        var hit = false;
        for (var i = 0; i < state.sizes.length; i++) {
          if (ps.indexOf(state.sizes[i]) !== -1) { hit = true; break; }
        }
        if (!hit) return false;
      }
      return true;
    });

    grid.innerHTML = "";
    rendered = 0;
    renderMore();

    resultsInfo.textContent = filtered.length + " products";
    emptyEl.hidden = filtered.length !== 0;
  }

  function renderMore() {
    var next = filtered.slice(rendered, rendered + PAGE);
    var frag = document.createDocumentFragment();
    next.forEach(function (p) {
      frag.appendChild(buildCard(p));
    });
    grid.appendChild(frag);
    rendered += next.length;
  }

  function buildCard(p) {
    var card = document.createElement("article");
    card.className = "card";

    var imgWrap = document.createElement("div");
    imgWrap.className = "card-img";

    if (p.img) {
      var im = document.createElement("img");
      im.loading = "lazy";
      im.src = p.img;
      im.alt = p.category + " " + p.color;
      imgWrap.appendChild(im);
    } else {
      var no = document.createElement("span");
      no.className = "noimg";
      no.textContent = "Image not available";
      imgWrap.appendChild(no);
    }
    card.appendChild(imgWrap);

    var body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML =
      '<div class="card-code">' + esc(p.sku) + '</div>' +
      (p.color ? '<div class="card-color">' + esc(p.color) + '</div>' : '') +
      '<div class="card-cat">' + esc(p.category) + '</div>';
    card.appendChild(body);

    card.addEventListener("click", function () { openLightbox(p); });
    return card;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Lightbox */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbInfo = document.getElementById("lbInfo");
  var lbThumbs = document.getElementById("lbThumbs");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var lbGallery = [];
  var lbIdx = 0;

  function showImage(idx) {
    if (!lbGallery.length) { lbImg.removeAttribute("src"); lbImg.style.display = "none"; return; }
    lbIdx = (idx + lbGallery.length) % lbGallery.length;  // wrap-around
    lbImg.style.display = "";
    lbImg.src = lbGallery[lbIdx];
    [].forEach.call(lbThumbs.children, function (t, i) {
      t.classList.toggle("active", i === lbIdx);
    });
  }

  function renderThumbs() {
    lbThumbs.innerHTML = "";
    var multi = lbGallery.length > 1;
    lbPrev.style.display = lbNext.style.display = multi ? "" : "none";
    if (!multi) return;
    lbGallery.forEach(function (url, i) {
      var t = document.createElement("button");
      t.className = "lb-thumb" + (i === 0 ? " active" : "");
      var im = document.createElement("img");
      im.src = url;
      im.loading = "lazy";
      t.appendChild(im);
      t.addEventListener("click", function (e) {
        e.stopPropagation();
        showImage(i);
      });
      lbThumbs.appendChild(t);
    });
  }

  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", function (e) { e.stopPropagation(); showImage(lbIdx - 1); });
  lbNext.addEventListener("click", function (e) { e.stopPropagation(); showImage(lbIdx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

  /* Swipe dx/sx sull'immagine (touch) */
  var lbMain = document.querySelector(".lb-main");
  if (lbMain) {
    var touchX = 0, touchY = 0, touching = false;
    var SWIPE_MIN = 40; // px minimi per considerarlo swipe
    lbMain.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { touching = false; return; }
      touching = true;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }, { passive: true });
    lbMain.addEventListener("touchend", function (e) {
      if (!touching || lbGallery.length < 2) { touching = false; return; }
      touching = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - touchX;
      var dy = t.clientY - touchY;
      // solo swipe prevalentemente orizzontali
      if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) showImage(lbIdx + 1); // swipe verso sinistra → prossima
        else showImage(lbIdx - 1);        // swipe verso destra → precedente
      }
    }, { passive: true });
  }
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") showImage(lbIdx - 1);
    else if (e.key === "ArrowRight") showImage(lbIdx + 1);
  });

  function row(label, val) {
    if (!val) return "";
    return "<dt>" + esc(label) + ":</dt><dd>" + esc(val) + "</dd>";
  }

  function openLightbox(p) {
    lbGallery = (p.gallery && p.gallery.length) ? p.gallery : (p.img ? [p.img] : []);
    renderThumbs();
    showImage(0);
    var sizes = p.sizes || [];
    lbInfo.innerHTML =
      '<div class="lb-cat">' + esc(p.gender === "men" ? "Man" : "Woman") + '</div>' +
      '<h2>' + esc(p.sku) + '</h2>' +
      '<dl>' +
      row("Color", p.color) +
      row("Category", p.category) +
      row("Available sizes", sizes.join(", ")) +
      '</dl>';
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  /* Eventi filtri */
  genderEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg");
    if (!btn) return;
    [].forEach.call(genderEl.querySelectorAll(".seg"), function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    state.gender = btn.getAttribute("data-gender");
    state.category = "";
    state.sizes = [];
    draft.category = "";
    draft.sizes = [];
    updateTriggerState();
    populateSelects();
    applyFilters();
  });

  /* Toolbar compatta allo scroll (il titolo scompare, resta la riga filtri) */
  var toolbarEl = document.querySelector(".toolbar");
  var lastScrolled = false;
  function onScroll() {
    var scrolled = window.pageYOffset > 40;
    if (scrolled !== lastScrolled) {
      toolbarEl.classList.toggle("scrolled", scrolled);
      lastScrolled = scrolled;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Infinite scroll */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && rendered < filtered.length) renderMore();
      });
    }, { rootMargin: "600px" });
    io.observe(sentinel);
  }

  /* Init */
  (function setInitialActive() {
    var initial = genderEl.querySelector('.seg[data-gender="' + state.gender + '"]');
    if (initial) initial.classList.add("active");
  })();
  populateSelects();
  updateTriggerState();
  applyFilters();
})();
