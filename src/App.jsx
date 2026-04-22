import { useState, useRef } from "react";

// ── Fonts ──────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;600&family=Lato:wght@300;400&display=swap";
document.head.appendChild(fontLink);

// ── Global styles ──────────────────────────────────────────────────────────
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
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }

    .tile {
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); overflow: hidden; cursor: pointer;
      transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition);
      position: relative;
    }
    .tile:hover { transform: translateY(-3px); border-color: var(--gold); box-shadow: 0 8px 30px rgba(201,168,76,.15); }
    .tile-img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: var(--surface); }
    .tile-placeholder { width: 100%; aspect-ratio: 1; background: var(--surface); display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 2rem; }
    .tile-label { padding: 10px 12px 4px; font-family: var(--font-display); font-size: 0.78rem; letter-spacing: .08em; color: var(--cream); text-align: center; line-height: 1.4; }
    .tile-count { font-family: var(--font-ui); font-size: 0.68rem; color: var(--muted); text-align: center; padding: 4px 12px 10px; }

    .tile-add { background: transparent; border: 1px dashed var(--border); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: border-color var(--transition); }
    .tile-add:hover { border-color: var(--gold); }
    .tile-add-inner { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--muted); transition: color var(--transition); padding: 12px; }
    .tile-add:hover .tile-add-inner { color: var(--gold-lt); }
    .tile-add-icon { font-size: 1.8rem; line-height: 1; }
    .tile-add-label { font-family: var(--font-display); font-size: 0.7rem; letter-spacing: .1em; text-align: center; }

    .breadcrumb { display: flex; align-items: center; gap: 8px; font-family: var(--font-ui); font-size: 0.75rem; letter-spacing: .06em; color: var(--muted); margin-bottom: 28px; flex-wrap: wrap; }
    .breadcrumb-sep { color: var(--border); }
    .breadcrumb-link { color: var(--gold); cursor: pointer; transition: color var(--transition); text-transform: uppercase; }
    .breadcrumb-link:hover { color: var(--gold-lt); }
    .breadcrumb-current { color: var(--cream); text-transform: uppercase; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 16px; flex-wrap: wrap; }
    .page-title { font-family: var(--font-display); font-size: clamp(1.4rem, 4vw, 2.2rem); letter-spacing: .06em; color: var(--cream); line-height: 1.2; }
    .page-subtitle { font-family: var(--font-body); font-style: italic; font-size: 1rem; color: var(--muted); margin-top: 4px; }
    .page-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .photo-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color var(--transition); position: relative; }
    .photo-card:hover { border-color: var(--gold); }
    .photo-card img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
    .photo-desc-edit { width: 100%; padding: 8px 12px; background: var(--surface); border-top: 1px solid var(--border); font-size: 0.88rem; color: var(--cream); min-height: 60px; display: block; }

    .overlay { position: fixed; inset: 0; background: rgba(10,9,7,.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; animation: fadeIn .18s ease; }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    .modal { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; width: 100%; max-width: 420px; animation: slideUp .2s ease; }
    @keyframes slideUp { from { transform: translateY(16px); opacity:0 } to { transform: none; opacity:1 } }
    .modal-title { font-family: var(--font-display); font-size: 1rem; letter-spacing: .1em; color: var(--gold); margin-bottom: 20px; text-transform: uppercase; }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-family: var(--font-ui); font-size: 0.7rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
    .field-input { width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; font-family: var(--font-body); font-size: 1rem; color: var(--cream); transition: border-color var(--transition); }
    .field-input:focus { border-color: var(--gold); }
    .field-textarea { min-height: 80px; }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }

    .btn { font-family: var(--font-ui); font-size: 0.75rem; letter-spacing: .1em; text-transform: uppercase; padding: 10px 20px; border-radius: var(--radius); transition: all var(--transition); border: 1px solid transparent; }
    .btn-primary { background: var(--gold); color: var(--bg); border-color: var(--gold); }
    .btn-primary:hover { background: var(--gold-lt); border-color: var(--gold-lt); }
    .btn-ghost { color: var(--muted); border-color: var(--border); }
    .btn-ghost:hover { color: var(--cream); border-color: var(--muted); }
    .btn-sm { padding: 6px 14px; font-size: 0.68rem; }

    .app-header { border-bottom: 1px solid var(--border); padding: 0 32px; height: 60px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; background: rgba(15,14,11,.92); backdrop-filter: blur(12px); z-index: 10; }
    .app-logo { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: .18em; color: var(--gold); text-transform: uppercase; cursor: pointer; }
    .app-logo-sep { color: var(--border); margin: 0 4px; }

    .main { padding: 40px 32px; max-width: 1200px; margin: 0 auto; }

    .ornament { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; color: var(--border); font-size: 0.7rem; letter-spacing: .2em; }
    .ornament-line { flex: 1; height: 1px; background: var(--border); }

    /* tile controls (edit + delete) */
    .tile-controls { position: absolute; top: 6px; right: 6px; display: flex; flex-direction: column; gap: 4px; opacity: 0; transition: opacity var(--transition); z-index: 2; }
    .tile:hover .tile-controls { opacity: 1; }
    .ctrl-btn { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .75rem; cursor: pointer; border: none; }
    .ctrl-del { background: rgba(155,58,58,.88); color: #fff; }
    .ctrl-edit { background: rgba(201,168,76,.88); color: #0f0e0b; }

    /* photo controls */
    .photo-controls { position: absolute; top: 6px; right: 6px; display: flex; flex-direction: column; gap: 4px; opacity: 0; transition: opacity var(--transition); z-index: 2; }
    .photo-card:hover .photo-controls { opacity: 1; }

    /* cover badge / button */
    .cover-badge { position: absolute; bottom: 6px; left: 6px; background: rgba(201,168,76,.92); color: var(--bg); font-family: var(--font-ui); font-size: .6rem; letter-spacing: .08em; text-transform: uppercase; padding: 2px 8px; border-radius: 2px; pointer-events: none; }
    .cover-set-btn { position: absolute; bottom: 6px; left: 6px; background: rgba(20,18,14,.78); color: var(--muted); font-family: var(--font-ui); font-size: .6rem; letter-spacing: .06em; text-transform: uppercase; padding: 2px 8px; border-radius: 2px; border: 1px solid var(--border); cursor: pointer; transition: all var(--transition); opacity: 0; }
    .photo-card:hover .cover-set-btn { opacity: 1; }
    .cover-set-btn:hover { background: rgba(201,168,76,.88); color: var(--bg); border-color: var(--gold); }
  `}</style>
);

// ── Storage ────────────────────────────────────────────────────────────────
const STORE_KEY = "museum_v1";
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { themes: [] }; }
  catch { return { themes: [] }; }
}
function save(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

// ── Image resize ───────────────────────────────────────────────────────────
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

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ title, fields, onConfirm, onClose, confirmLabel = "Запази", initialValues = {} }) {
  const [vals, setVals] = useState(() =>
    Object.fromEntries(fields.map(f => [f.key, initialValues[f.key] ?? ""]))
  );
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
          <button className="btn btn-primary" onClick={confirm}>{confirmLabel}</button>
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

  const theme = data.themes.find(t => t.id === view.themeId);
  const vitrine = theme?.vitrines?.find(v => v.id === view.vitrineId);

  // CRUD
  const addTheme = ({ name, desc }) => {
    update(d => ({ ...d, themes: [...d.themes, { id: Date.now(), name, desc, vitrines: [] }] }));
    setModal(null);
  };
  const editTheme = (id, { name, desc }) => {
    update(d => ({ ...d, themes: d.themes.map(t => t.id !== id ? t : { ...t, name, desc }) }));
    setModal(null);
  };
  const deleteTheme = (tId) => update(d => ({ ...d, themes: d.themes.filter(t => t.id !== tId) }));

  const addVitrine = ({ name, desc }) => {
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t, vitrines: [...(t.vitrines || []), { id: Date.now(), name, desc, cover: null, photos: [] }]
      })
    }));
    setModal(null);
  };
  const editVitrine = (vId, { name, desc }) => {
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t, vitrines: t.vitrines.map(v => v.id !== vId ? v : { ...v, name, desc })
      })
    }));
    setModal(null);
  };
  const deleteVitrine = (vId) => {
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t, vitrines: t.vitrines.filter(v => v.id !== vId)
      })
    }));
  };

  const handleAddPhoto = (vitrineId) => { setPendingUpload(vitrineId); fileRef.current.click(); };
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
        })
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
          const deleted = v.photos.find(p => p.id === photoId);
          const photos = v.photos.filter(p => p.id !== photoId);
          const cover = v.cover === deleted?.src ? (photos[0]?.src || null) : v.cover;
          return { ...v, photos, cover };
        })
      })
    }));
  };

  const setCover = (photoSrc) => {
    update(d => ({
      ...d,
      themes: d.themes.map(t => t.id !== view.themeId ? t : {
        ...t,
        vitrines: t.vitrines.map(v => v.id !== view.vitrineId ? v : { ...v, cover: photoSrc })
      })
    }));
  };

  const getThemeCover = (t) => {
    for (const v of (t.vitrines || [])) {
      if (v.cover) return v.cover;
      if (v.photos?.length) return v.photos[0].src;
    }
    return null;
  };

  const goHome = () => setView({ page: "home", themeId: null, vitrineId: null });
  const goTheme = (id) => setView({ page: "theme", themeId: id, vitrineId: null });
  const goVitrine = (tId, vId) => setView({ page: "vitrine", themeId: tId, vitrineId: vId });

  // Theme fields
  const themeFields = [
    { key: "name", label: "Заглавие", required: true, placeholder: "напр. Порцеланови кукли" },
    { key: "desc", label: "Описание", type: "textarea", placeholder: "Кратко описание на темата…" },
  ];
  const vitrineFields = [
    { key: "name", label: "Заглавие", required: true, placeholder: "напр. Витрина I — Бидермайер" },
    { key: "desc", label: "Описание", type: "textarea", placeholder: "Описание на витрината…" },
  ];

  return (
    <>
      <GlobalStyle />
      <input type="file" accept="image/*" multiple ref={fileRef} style={{ display: "none" }} onChange={onFileChange} />

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

        {/* HOME */}
        {view.page === "home" && <>
          <div className="ornament"><div className="ornament-line" /><span>ТЕМИ</span><div className="ornament-line" /></div>
          <div className="breadcrumb"><span className="breadcrumb-current">Всички теми</span></div>
          <div className="page-header">
            <div>
              <div className="page-title">Музейна Колекция</div>
              <div className="page-subtitle">Куклена изложба — разпределение по теми</div>
            </div>
          </div>
          <div className="grid">
            {data.themes.map(t => (
              <div key={t.id} className="tile">
                <div className="tile-controls">
                  <button className="ctrl-btn ctrl-edit" title="Редактирай" onClick={e => { e.stopPropagation(); setModal({ type: "editTheme", id: t.id }); }}>✎</button>
                  <button className="ctrl-btn ctrl-del" title="Изтрий" onClick={e => { e.stopPropagation(); deleteTheme(t.id); }}>✕</button>
                </div>
                {getThemeCover(t)
                  ? <img className="tile-img" src={getThemeCover(t)} alt={t.name} onClick={() => goTheme(t.id)} />
                  : <div className="tile-placeholder" onClick={() => goTheme(t.id)}>🏛️</div>}
                <div className="tile-label" onClick={() => goTheme(t.id)}>{t.name}</div>
                <div className="tile-count">{(t.vitrines || []).length} витрини</div>
              </div>
            ))}
            <button className="tile-add" onClick={() => setModal("newTheme")}>
              <div className="tile-add-inner">
                <span className="tile-add-icon">＋</span>
                <span className="tile-add-label">Нова тема</span>
              </div>
            </button>
          </div>
        </>}

        {/* THEME */}
        {view.page === "theme" && theme && <>
          <div className="ornament"><div className="ornament-line" /><span>ВИТРИНИ</span><div className="ornament-line" /></div>
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
            <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: "editTheme", id: theme.id })}>✎ Редактирай тема</button>
          </div>
          <div className="grid">
            {(theme.vitrines || []).map(v => (
              <div key={v.id} className="tile">
                <div className="tile-controls">
                  <button className="ctrl-btn ctrl-edit" title="Редактирай" onClick={e => { e.stopPropagation(); setModal({ type: "editVitrine", id: v.id }); }}>✎</button>
                  <button className="ctrl-btn ctrl-del" title="Изтрий" onClick={e => { e.stopPropagation(); deleteVitrine(v.id); }}>✕</button>
                </div>
                {v.cover || v.photos?.[0]?.src
                  ? <img className="tile-img" src={v.cover || v.photos[0].src} alt={v.name} onClick={() => goVitrine(theme.id, v.id)} />
                  : <div className="tile-placeholder" onClick={() => goVitrine(theme.id, v.id)}>🪆</div>}
                <div className="tile-label" onClick={() => goVitrine(theme.id, v.id)}>{v.name}</div>
                <div className="tile-count">{(v.photos || []).length} снимки</div>
              </div>
            ))}
            <button className="tile-add" onClick={() => setModal("newVitrine")}>
              <div className="tile-add-inner">
                <span className="tile-add-icon">＋</span>
                <span className="tile-add-label">Нова витрина</span>
              </div>
            </button>
          </div>
        </>}

        {/* VITRINE */}
        {view.page === "vitrine" && vitrine && <>
          <div className="ornament"><div className="ornament-line" /><span>СНИМКИ</span><div className="ornament-line" /></div>
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
            <div className="page-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: "editVitrine", id: vitrine.id })}>✎ Редактирай витрина</button>
              <button className="btn btn-primary" onClick={() => handleAddPhoto(vitrine.id)}>+ Добави снимки</button>
            </div>
          </div>
          <div className="photo-grid">
            {(vitrine.photos || []).map(p => {
              const isCover = vitrine.cover === p.src;
              return (
                <div key={p.id} className="photo-card">
                  <div className="photo-controls">
                    <button className="ctrl-btn ctrl-del" title="Изтрий" onClick={() => deletePhoto(p.id)}>✕</button>
                  </div>
                  <img src={p.src} alt={p.desc || "снимка"} />
                  {isCover
                    ? <span className="cover-badge">★ Корица</span>
                    : <button className="cover-set-btn" onClick={() => setCover(p.src)}>Задай корица</button>
                  }
                  <textarea
                    className="photo-desc-edit"
                    value={p.desc}
                    onChange={e => updatePhotoDesc(p.id, e.target.value)}
                    placeholder="Описание на снимката…"
                    rows={2}
                  />
                </div>
              );
            })}
            {!(vitrine.photos?.length) && (
              <div style={{ color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--font-body)", gridColumn: "1/-1", padding: "24px 0" }}>
                Все още няма снимки. Добавете първата снимка с бутона горе.
              </div>
            )}
          </div>
        </>}
      </main>

      {/* MODALS */}
      {modal === "newTheme" && (
        <Modal title="Нова тема" confirmLabel="Създай" fields={themeFields}
          onConfirm={addTheme} onClose={() => setModal(null)} />
      )}
      {modal === "newVitrine" && (
        <Modal title="Нова витрина" confirmLabel="Създай" fields={vitrineFields}
          onConfirm={addVitrine} onClose={() => setModal(null)} />
      )}
      {modal?.type === "editTheme" && (() => {
        const t = data.themes.find(x => x.id === modal.id);
        return t ? (
          <Modal title="Редактирай тема" confirmLabel="Запази"
            initialValues={{ name: t.name, desc: t.desc || "" }}
            fields={themeFields}
            onConfirm={vals => editTheme(modal.id, vals)} onClose={() => setModal(null)} />
        ) : null;
      })()}
      {modal?.type === "editVitrine" && (() => {
        const v = theme?.vitrines?.find(x => x.id === modal.id);
        return v ? (
          <Modal title="Редактирай витрина" confirmLabel="Запази"
            initialValues={{ name: v.name, desc: v.desc || "" }}
            fields={vitrineFields}
            onConfirm={vals => editVitrine(modal.id, vals)} onClose={() => setModal(null)} />
        ) : null;
      })()}
    </>
  );
}
