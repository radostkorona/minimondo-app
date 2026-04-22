import { useState, useRef, useEffect } from "react";

// ── Fonts ──────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;600&family=Lato:wght@300;400&display=swap";
document.head.appendChild(fontLink);

// ── Palette / CSS vars ────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:       #0f0e0b;
      --surface:  #1a1814;
      --card:     #211f1a;
      --border:   #3a3630;
      --gold:     #c9a84c;
      --gold-lt:  #e2c97e;
      --cream:    #f5f0e8;
      --muted:    #8a8070;
      --danger:   #9b3a3a;
      --radius:   4px;
      --font-display: 'Cinzel', serif;
      --font-body:    'Cormorant Garamond', serif;
      --font-ui:      'Lato', sans-serif;
      --transition: 220ms ease;
    }
    body { background: var(--bg); color: var(--cream); font-family: var(--font-body); }
    button { cursor: pointer; border: none; background: none; font-family: inherit; color: inherit; }
    input, textarea { font-family: var(--font-body); color: var(--cream); background: transparent; border: none; outline: none; }
    textarea { resize: vertical; }

    /* scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    /* card grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }

    /* square tile */
    .tile {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      cursor: pointer;
      transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition);
      position: relative;
    }
    .tile:hover {
      transform: translateY(-3px);
      border-color: var(--gold);
      box-shadow: 0 8px 30px rgba(201,168,76,.15);
    }
    .tile-img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      display: block;
      background: var(--surface);
    }
    .tile-placeholder {
      width: 100%;
      aspect-ratio: 1;
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 2rem;
    }
    .tile-label {
      padding: 10px 12px 12px;
      font-family: var(--font-display);
      font-size: 0.78rem;
      letter-spacing: .08em;
      color: var(--cream);
      text-align: center;
      line-height: 1.4;
    }
    .tile-count {
      font-family: var(--font-ui);
      font-size: 0.68rem;
      color: var(--muted);
      text-align: center;
      padding-bottom: 10px;
    }

    /* add tile */
    .tile-add {
      background: transparent;
      border: 1px dashed var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      cursor: pointer;
      transition: border-color var(--transition);
    }
    .tile-add:hover { border-color: var(--gold); }
    .tile-add-inner {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--muted);
      transition: color var(--transition);
      padding: 12px;
    }
    .tile-add:hover .tile-add-inner { color: var(--gold-lt); }
    .tile-add-icon { font-size: 1.8rem; line-height: 1; }
    .tile-add-label {
      font-family: var(--font-display);
      font-size: 0.7rem;
      letter-spacing: .1em;
      text-align: center;
    }

    /* breadcrumb */
    .breadcrumb {
      display: flex; align-items: center; gap: 8px;
      font-family: var(--font-ui);
      font-size: 0.75rem;
      letter-spacing: .06em;
      color: var(--muted);
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .breadcrumb-sep { color: var(--border); }
    .breadcrumb-link {
      color: var(--gold);
      cursor: pointer;
      transition: color var(--transition);
      text-transform: uppercase;
    }
    .breadcrumb-link:hover { color: var(--gold-lt); }
    .breadcrumb-current { color: var(--cream); text-transform: uppercase; }

    /* page header */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end;
      margin-bottom: 32px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .page-title {
      font-family: var(--font-display);
      font-size: clamp(1.4rem, 4vw, 2.2rem);
      letter-spacing: .06em;
      color: var(--cream);
      line-height: 1.2;
    }
    .page-subtitle {
      font-family: var(--font-body);
      font-style: italic;
      font-size: 1rem;
      color: var(--muted);
      margin-top: 4px;
    }

    /* description block */
    .description-block {
      font-family: var(--font-body);
      font-size: 1.05rem;
      color: var(--muted);
      line-height: 1.7;
      font-style: italic;
      margin-bottom: 28px;
      max-width: 640px;
    }

    /* photo grid */
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .photo-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      transition: border-color var(--transition);
    }
    .photo-card:hover { border-color: var(--gold); }
    .photo-card img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      display: block;
    }
    .photo-desc {
      padding: 10px 12px;
      font-size: 0.88rem;
      color: var(--muted);
      line-height: 1.5;
      font-style: italic;
    }
    .photo-desc-edit {
      width: 100%; padding: 8px 12px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      font-size: 0.88rem;
      color: var(--cream);
      min-height: 60px;
    }

    /* modal overlay */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(10,9,7,.85);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
      padding: 20px;
      animation: fadeIn .18s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 32px;
      width: 100%; max-width: 420px;
      animation: slideUp .2s ease;
    }
    @keyframes slideUp { from { transform: translateY(16px); opacity:0 } to { transform: none; opacity:1 } }
    .modal-title {
      font-family: var(--font-display);
      font-size: 1rem;
      letter-spacing: .1em;
      color: var(--gold);
      margin-bottom: 20px;
      text-transform: uppercase;
    }
    .field { margin-bottom: 16px; }
    .field label {
      display: block;
      font-family: var(--font-ui);
      font-size: 0.7rem;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .field-input {
      width: 100%;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 12px;
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--cream);
      transition: border-color var(--transition);
    }
    .field-input:focus { border-color: var(--gold); }
    .field-textarea { min-height: 80px; }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }

    /* buttons */
    .btn {
      font-family: var(--font-ui);
      font-size: 0.75rem;
      letter-spacing: .1em;
      text-transform: uppercase;
      padding: 10px 20px;
      border-radius: var(--radius);
      transition: all var(--transition);
      border: 1px solid transparent;
    }
    .btn-primary {
      background: var(--gold);
      color: var(--bg);
      border-color: var(--gold);
    }
    .btn-primary:hover { background: var(--gold-lt); border-color: var(--gold-lt); }
    .btn-ghost {
      color: var(--muted);
      border-color: var(--border);
    }
    .btn-ghost:hover { color: var(--cream); border-color: var(--muted); }

    /* header bar */
    .app-header {
      border-bottom: 1px solid var(--border);
      padding: 0 32px;
      height: 60px;
      display: flex; align-items: center; gap: 12px;
      position: sticky; top: 0;
      background: rgba(15,14,11,.92);
      backdrop-filter: blur(12px);
      z-index: 10;
    }
    .app-logo {
      font-family: var(--font-display);
      font-size: 0.85rem;
      letter-spacing: .18em;
      color: var(--gold);
      text-transform: uppercase;
      cursor: pointer;
    }
    .app-logo-sep { color: var(--border); margin: 0 4px; }

    /* main area */
    .main { padding: 40px 32px; max-width: 1200px; margin: 0 auto; }

    /* ornament */
    .ornament {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 36px;
      color: var(--border);
      font-size: 0.7rem;
      letter-spacing: .2em;
    }
    .ornament-line { flex: 1; height: 1px; background: var(--border); }

    /* delete btn on card */
    .card-del {
      position: absolute; top: 6px; right: 6px;
      width: 24px; height: 24px;
      background: rgba(155,58,58,.7);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem;
      opacity: 0;
      transition: opacity var(--transition);
      z-index: 2;
      color: #fff;
    }
    .tile:hover .card-del,
    .photo-card:hover .card-del { opacity: 1; }

    /* cover badge on first image */
    .cover-badge {
      position: absolute; bottom: 6px; left: 6px;
      background: rgba(201,168,76,.85);
      color: var(--bg);
      font-family: var(--font-ui);
      font-size: .6rem;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 2px;
    }
  `}</style>
);

// ── Storage helpers ────────────────────────────────────────────────────────
const STORE_KEY = "museum_v1";
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { themes: [] }; }
  catch { return { themes: [] }; }
}
function save(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// ── Image helpers ─────────────────────────────────────────────────────────
function readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        res(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = rej;
      img.src = e.target.result;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────
function Modal({ title, fields, onConfirm, onClose }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map(f => [f.key, ""])));
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }));
  const confirm = () => {
    if (fields.filter(f => f.required).some(f => !vals[f.key].trim())) return;
    onConfirm(vals);
  };
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {fields.map(f => (
          <div className="field" key={f.key}>
            <label>{f.label}{f.required ? " *" : ""}</label>
            {f.type === "textarea"
              ? <textarea className="field-input field-textarea" value={vals[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ""} />
              : <input className="field-input" value={vals[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ""} />}
          </div>
        ))}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Отказ</button>
          <button className="btn btn-primary" onClick={confirm}>Създай</button>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(load);
  const [view, setView] = useState({ page: "home", themeId: null, vitrineId: null });
  const [modal, setModal] = useState(null);
  const fileRef = useRef();
  const [pendingUpload, setPendingUpload] = useState(null);

  const update = (fn) => setData(prev => { const next = fn(prev); save(next); return next; });

  // ── Getters ──
  const theme = data.themes.find(t => t.id === view.themeId);
  const vitrine = theme?.vitrines?.find(v => v.id === view.vitrineId);

  // ── Handlers ──
  const addTheme = ({ name, desc }) => {
    update(d => ({ ...d, themes: [...d.themes, { id: Date.now(), name, desc, cover: null, vitrines: [] }] }));
    setModal(null);
  };

  const addVitrine = ({ name, desc }) => {
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t, vitrines: [...(t.vitrines || []), { id: Date.now(), name, desc, cover: null, photos: [] }]
      })
    }));
    setModal(null);
  };

  const handleAddPhoto = (vitrineId) => {
    setPendingUpload(vitrineId);
    fileRef.current.click();
  };

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const results = await Promise.all(files.map(readFile));
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t,
        vitrines: t.vitrines.map(v => {
          if (v.id !== pendingUpload) return v;
          const newPhotos = results.map(src => ({ id: Date.now() + Math.random(), src, desc: "" }));
          const photos = [...(v.photos || []), ...newPhotos];
          return { ...v, photos, cover: v.cover || photos[0]?.src || null };
        }),
        // update theme cover from first vitrine image
      })
    }));
    e.target.value = "";
    setPendingUpload(null);
  };

  const updatePhotoDesc = (photoId, desc) => {
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t,
        vitrines: t.vitrines.map(v => v.id !== view.vitrineId ? v : {
          ...v, photos: v.photos.map(p => p.id !== photoId ? p : { ...p, desc })
        })
      })
    }));
  };

  const deletePhoto = (photoId) => {
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t,
        vitrines: t.vitrines.map(v => {
          if (v.id !== view.vitrineId) return v;
          const photos = v.photos.filter(p => p.id !== photoId);
          return { ...v, photos, cover: photos[0]?.src || null };
        })
      })
    }));
  };

  const deleteVitrine = (vId) => {
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t, vitrines: t.vitrines.filter(v => v.id !== vId)
      })
    }));
  };

  const deleteTheme = (tId) => {
    update(d => ({ ...d, themes: d.themes.filter(t => t.id !== tId) }));
  };

  // Auto-set covers when themes have vitrines with photos
  const getThemeCover = (t) => {
    if (t.cover) return t.cover;
    for (const v of (t.vitrines || [])) {
      if (v.photos?.length) return v.photos[0].src;
      if (v.cover) return v.cover;
    }
    return null;
  };

  // ── Views ──
  const goHome = () => setView({ page: "home", themeId: null, vitrineId: null });
  const goTheme = (id) => setView({ page: "theme", themeId: id, vitrineId: null });
  const goVitrine = (tId, vId) => setView({ page: "vitrine", themeId: tId, vitrineId: vId });

  return (
    <>
      <GlobalStyle />
      <input type="file" accept="image/*" multiple ref={fileRef} style={{ display: "none" }} onChange={onFileChange} />

      {/* Header */}
      <header className="app-header">
        <span className="app-logo" onClick={goHome}>✦ Музейна Колекция</span>
        {view.page !== "home" && <>
          <span className="app-logo-sep">›</span>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: ".72rem", letterSpacing: ".08em", color: "var(--muted)", textTransform: "uppercase" }}>
            {theme?.name}{vitrine ? ` › ${vitrine.name}` : ""}
          </span>
        </>}
      </header>

      <main className="main">
        {/* ── HOME: Themes ── */}
        {view.page === "home" && <>
          <div className="ornament">
            <div className="ornament-line" />
            <span>ТЕМИ</span>
            <div className="ornament-line" />
          </div>
          <div className="breadcrumb">
            <span className="breadcrumb-current">Всички теми</span>
          </div>
          <div className="page-header">
            <div>
              <div className="page-title">Музейна Колекция</div>
              <div className="page-subtitle">Куклена изложба — разпределение по теми</div>
            </div>
          </div>
          <div className="grid">
            {data.themes.map(t => (
              <div key={t.id} className="tile" style={{ position: "relative" }}>
                <button className="card-del" onClick={e => { e.stopPropagation(); deleteTheme(t.id); }}>✕</button>
                {getThemeCover(t)
                  ? <img className="tile-img" src={getThemeCover(t)} alt={t.name} onClick={() => goTheme(t.id)} />
                  : <div className="tile-placeholder" onClick={() => goTheme(t.id)}>🏛️</div>}
                <div className="tile-label" onClick={() => goTheme(t.id)}>{t.name}</div>
                <div className="tile-count">{(t.vitrines || []).length} витрини</div>
              </div>
            ))}
            <button className="tile-add" onClick={() => setModal("theme")}>
              <div className="tile-add-inner">
                <span className="tile-add-icon">＋</span>
                <span className="tile-add-label">Нова тема</span>
              </div>
            </button>
          </div>
        </>}

        {/* ── THEME: Vitrines ── */}
        {view.page === "theme" && theme && <>
          <div className="ornament">
            <div className="ornament-line" />
            <span>ВИТРИНИ</span>
            <div className="ornament-line" />
          </div>
          <div className="breadcrumb">
            <span className="breadcrumb-link" onClick={goHome}>Теми</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{theme.name}</span>
          </div>
          <div className="page-header">
            <div>
              <div className="page-title">{theme.name}</div>
              {theme.desc && <div className="page-subtitle">{theme.desc}</div>}
            </div>
          </div>
          {theme.desc && <div className="description-block">{theme.desc}</div>}
          <div className="grid">
            {(theme.vitrines || []).map(v => (
              <div key={v.id} className="tile" style={{ position: "relative" }}>
                <button className="card-del" onClick={e => { e.stopPropagation(); deleteVitrine(v.id); }}>✕</button>
                {v.cover || v.photos?.[0]?.src
                  ? <img className="tile-img" src={v.cover || v.photos[0].src} alt={v.name} onClick={() => goVitrine(theme.id, v.id)} />
                  : <div className="tile-placeholder" onClick={() => goVitrine(theme.id, v.id)}>🪆</div>}
                <div className="tile-label" onClick={() => goVitrine(theme.id, v.id)}>{v.name}</div>
                <div className="tile-count">{(v.photos || []).length} снимки</div>
              </div>
            ))}
            <button className="tile-add" onClick={() => setModal("vitrine")}>
              <div className="tile-add-inner">
                <span className="tile-add-icon">＋</span>
                <span className="tile-add-label">Нова витрина</span>
              </div>
            </button>
          </div>
        </>}

        {/* ── VITRINE: Photos ── */}
        {view.page === "vitrine" && vitrine && <>
          <div className="ornament">
            <div className="ornament-line" />
            <span>СНИМКИ</span>
            <div className="ornament-line" />
          </div>
          <div className="breadcrumb">
            <span className="breadcrumb-link" onClick={goHome}>Теми</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-link" onClick={() => goTheme(theme.id)}>{theme.name}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{vitrine.name}</span>
          </div>
          <div className="page-header">
            <div>
              <div className="page-title">{vitrine.name}</div>
              {vitrine.desc && <div className="page-subtitle">{vitrine.desc}</div>}
            </div>
            <button className="btn btn-primary" onClick={() => handleAddPhoto(vitrine.id)}>+ Добави снимки</button>
          </div>
          {vitrine.desc && <div className="description-block">{vitrine.desc}</div>}
          <div className="photo-grid">
            {(vitrine.photos || []).map((p, i) => (
              <div key={p.id} className="photo-card" style={{ position: "relative" }}>
                <button className="card-del" onClick={() => deletePhoto(p.id)}>✕</button>
                {i === 0 && <span className="cover-badge">Корица</span>}
                <img src={p.src} alt={p.desc || "снимка"} />
                <textarea
                  className="photo-desc-edit"
                  value={p.desc}
                  onChange={e => updatePhotoDesc(p.id, e.target.value)}
                  placeholder="Описание на снимката…"
                  rows={2}
                />
              </div>
            ))}
            {!(vitrine.photos?.length) && (
              <div style={{ color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--font-body)", gridColumn: "1/-1", padding: "24px 0" }}>
                Все още няма снимки в тази витрина. Добавете първата снимка с бутона горе.
              </div>
            )}
          </div>
        </>}
      </main>

      {/* ── Modals ── */}
      {modal === "theme" && (
        <Modal
          title="Нова тема"
          fields={[
            { key: "name", label: "Заглавие", required: true, placeholder: "напр. Порцеланови кукли" },
            { key: "desc", label: "Описание", type: "textarea", placeholder: "Кратко описание на темата…" },
          ]}
          onConfirm={addTheme}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "vitrine" && (
        <Modal
          title="Нова витрина"
          fields={[
            { key: "name", label: "Заглавие", required: true, placeholder: "напр. Витрина I — Бидермайер" },
            { key: "desc", label: "Описание", type: "textarea", placeholder: "Описание на витрината…" },
          ]}
          onConfirm={addVitrine}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
