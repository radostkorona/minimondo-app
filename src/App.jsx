import { useState, useRef, useEffect, useCallback } from "react";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "firebase/auth";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc,
  query, orderBy, writeBatch
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Fonts ──────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;600&family=Lato:wght@300;400&display=swap";
document.head.appendChild(fontLink);

// ── Cloudinary ─────────────────────────────────────────────────────────────
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) {
  const MAX = 1200;
  // resize first
  const resized = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(b => res(b), "image/jpeg", 0.82);
      };
      img.onerror = rej;
      img.src = e.target.result;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const fd = new FormData();
  fd.append("file", resized);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", "minimondo");
  const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST", body: fd
  });
  const data = await resp.json();
  if (!data.secure_url) throw new Error("Cloudinary upload failed");
  return { url: data.secure_url, publicId: data.public_id };
}

// ── Global styles ──────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f0e0b; --surface: #1a1814; --card: #211f1a; --border: #3a3630;
      --gold: #c9a84c; --gold-lt: #e2c97e; --cream: #f5f0e8; --muted: #8a8070;
      --radius: 4px;
      --font-display: 'Cinzel', serif;
      --font-body: 'Cormorant Garamond', serif;
      --font-ui: 'Lato', sans-serif;
      --transition: 220ms ease;
    }
    body { background: var(--bg); color: var(--cream); font-family: var(--font-body); overflow-x: hidden; width: 100%; }
    button { cursor: pointer; border: none; background: none; font-family: inherit; color: inherit; }
    input, textarea { font-family: var(--font-body); color: var(--cream); background: transparent; border: none; outline: none; }
    textarea { resize: vertical; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }

    .tile { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition); position: relative; }
    .tile:hover { transform: translateY(-3px); border-color: var(--gold); box-shadow: 0 8px 30px rgba(201,168,76,.15); }
    .tile.hidden-tile { opacity: 0.45; }
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
    .photo-card img { width: 100%; height: auto; display: block; cursor: zoom-in; }
    .photo-desc-edit { width: 100%; padding: 8px 12px; background: var(--surface); border-top: 1px solid var(--border); font-size: 0.88rem; color: var(--cream); min-height: 60px; display: block; }
    .photo-desc-view { padding: 10px 12px; font-size: 0.88rem; color: var(--muted); line-height: 1.5; font-style: italic; }

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
    .back-btn { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-ui); font-size: 0.7rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); cursor: pointer; transition: color var(--transition); background: none; border: none; padding: 0; margin-bottom: 20px; }
    .back-btn:hover { color: var(--gold); }
    .scroll-top-btn { position: fixed; bottom: 24px; right: 24px; width: 40px; height: 40px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-size: 1.1rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); z-index: 50; }
    .scroll-top-btn:hover { border-color: var(--gold); color: var(--gold); }
    .btn-danger { color: #c06060; border-color: #6a3030; }
    .btn-danger:hover { color: #e08080; border-color: #9b3a3a; }

    .app-header { border-bottom: 1px solid var(--border); padding: 0 32px; height: 60px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; background: rgba(15,14,11,.92); backdrop-filter: blur(12px); z-index: 10; }
    .app-header { border-bottom: 1px solid var(--border); padding: 0 24px; height: 64px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; background: rgba(15,14,11,.92); backdrop-filter: blur(12px); z-index: 10; }
    .app-logo-img { height: 44px; width: 44px; object-fit: contain; cursor: pointer; border-radius: 8px; }
    .app-logo-text { font-family: var(--font-display); font-size: 0.85rem; letter-spacing: .18em; color: var(--gold); text-transform: uppercase; cursor: pointer; }
    .app-logo-sep { color: var(--border); margin: 0 4px; }
    .header-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }

    .main { padding: 40px 32px; max-width: 1200px; margin: 0 auto; } @media (max-width: 600px) { .main { padding: 20px 16px; } .app-header { padding: 0 16px; } .grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; } .photo-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; } }

    .ornament { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; color: var(--border); font-size: 0.7rem; letter-spacing: .2em; }
    .ornament-line { flex: 1; height: 1px; background: var(--border); }

    /* tile controls */
    .tile-controls { position: absolute; top: 6px; right: 6px; display: flex; flex-direction: column; gap: 4px; opacity: 0; transition: opacity var(--transition); z-index: 2; }
    .tile:hover .tile-controls { opacity: 1; }
    .ctrl-btn { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .75rem; cursor: pointer; border: none; }
    .ctrl-del { background: rgba(155,58,58,.88); color: #fff; }
    .ctrl-edit { background: rgba(201,168,76,.88); color: #0f0e0b; }
    .ctrl-vis { background: rgba(50,50,40,.88); color: var(--muted); border: 1px solid var(--border) !important; font-size: .65rem; }
    .ctrl-vis.is-public { background: rgba(40,80,40,.88); color: #7bc47b; }

    /* photo controls */
    .photo-controls { position: absolute; top: 6px; right: 6px; display: flex; flex-direction: column; gap: 4px; opacity: 0; transition: opacity var(--transition); z-index: 2; }
    .photo-card:hover .photo-controls { opacity: 1; }

    /* cover badge / button */
    .cover-badge { display: block; width: 100%; text-align: center; background: rgba(201,168,76,.15); color: var(--gold); font-family: var(--font-ui); font-size: .6rem; letter-spacing: .08em; text-transform: uppercase; padding: 4px 8px; border-top: 1px solid rgba(201,168,76,.3); }
    .cover-set-btn { display: block; width: 100%; text-align: center; background: var(--surface); color: var(--muted); font-family: var(--font-ui); font-size: .6rem; letter-spacing: .06em; text-transform: uppercase; padding: 4px 8px; border-top: 1px solid var(--border); cursor: pointer; transition: all var(--transition); }
    .cover-set-btn:hover { background: rgba(201,168,76,.15); color: var(--gold); border-color: rgba(201,168,76,.3); }

    /* visibility badge */
    .vis-badge { position: absolute; top: 6px; left: 6px; font-family: var(--font-ui); font-size: .58rem; letter-spacing: .06em; text-transform: uppercase; padding: 2px 7px; border-radius: 2px; pointer-events: none; }
    .vis-badge.hidden { background: rgba(155,58,58,.7); color: #f5c0c0; }
    .vis-badge.public { background: rgba(40,80,40,.7); color: #a0e0a0; }

    /* login */
    .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .login-box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 40px; width: 100%; max-width: 360px; }
    .login-title { font-family: var(--font-display); font-size: 1.1rem; letter-spacing: .12em; color: var(--gold); margin-bottom: 24px; text-align: center; text-transform: uppercase; }
    .login-error { font-family: var(--font-ui); font-size: 0.75rem; color: #e08080; margin-top: 12px; text-align: center; }

    /* upload progress */
    .upload-overlay { position: fixed; inset: 0; background: rgba(10,9,7,.7); display: flex; align-items: center; justify-content: center; z-index: 200; }
    .upload-box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px 40px; text-align: center; font-family: var(--font-ui); font-size: .85rem; color: var(--muted); letter-spacing: .08em; }
    .upload-spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    /* ── Lightbox ── */
    .lightbox { position: fixed; inset: 0; background: rgba(5,4,3,.96); z-index: 300; display: flex; align-items: center; justify-content: center; animation: fadeIn .2s ease; }
    .lightbox-inner { display: flex; flex-direction: column; align-items: center; gap: 14px; max-width: calc(100vw - 120px); }
    .lightbox-img { max-width: 100%; max-height: calc(100vh - 180px); object-fit: contain; border-radius: 2px; box-shadow: 0 20px 60px rgba(0,0,0,.6); user-select: none; }
    .lightbox-close { position: fixed; top: 20px; right: 24px; width: 40px; height: 40px; border-radius: 50%; background: rgba(40,36,30,.9); border: 1px solid var(--border); color: var(--muted); font-size: 1.2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); z-index: 301; }
    .lightbox-close:hover { color: var(--cream); border-color: var(--gold); }
    .lightbox-arrow { position: fixed; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(40,36,30,.9); border: 1px solid var(--border); color: var(--muted); font-size: 1.3rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); z-index: 301; }
    .lightbox-arrow:hover { color: var(--cream); border-color: var(--gold); background: rgba(60,54,44,.95); }
    .lightbox-arrow.prev { left: 16px; }
    .lightbox-arrow.next { right: 16px; }
    .lightbox-arrow:disabled { opacity: 0.2; cursor: default; }
    .lightbox-info { text-align: center; }
    .lightbox-desc { font-family: var(--font-body); font-style: italic; font-size: 1.05rem; color: var(--cream); opacity: .8; }
    .lightbox-counter { font-family: var(--font-ui); font-size: 0.68rem; letter-spacing: .1em; color: var(--muted); margin-top: 4px; }
  `}</style>
);


// ── Lightbox ───────────────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const photo = photos[idx];
  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(photos.length - 1, i + 1)), [photos.length]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);
  return (
    <div className="lightbox" onClick={e => e.target === e.currentTarget && onClose()}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <button className="lightbox-arrow prev" onClick={prev} disabled={idx === 0}>‹</button>
      <div className="lightbox-inner">
        <img className="lightbox-img" src={photo.url} alt={photo.desc || ""} />
        <div className="lightbox-info">
          {photo.desc && <div className="lightbox-desc">{photo.desc}</div>}
          <div className="lightbox-counter">{idx + 1} / {photos.length}</div>
        </div>
      </div>
      <button className="lightbox-arrow next" onClick={next} disabled={idx === photos.length - 1}>›</button>
    </div>
  );
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

// ── Login ──────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onLogin();
    } catch {
      setError("Грешен имейл или парола.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-title">✦ Minimondo<br />Администратор</div>
        <div className="field">
          <label>Имейл</label>
          <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="вашият@имейл.com" />
        </div>
        <div className="field">
          <label>Парола</label>
          <input className="field-input" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={submit} disabled={loading}>
          {loading ? "Влизане…" : "Вход"}
        </button>
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
// ── PhotoDesc — local state to avoid cursor jump ──────────────────────────
function PhotoDesc({ photoId, initialDesc, onSave }) {
  const [desc, setDesc] = useState(initialDesc || "");
  useEffect(() => { setDesc(initialDesc || ""); }, [photoId]);
  return (
    <textarea
      className="photo-desc-edit"
      value={desc}
      onChange={e => setDesc(e.target.value)}
      onBlur={() => onSave(photoId, desc)}
      placeholder="Описание на снимката…"
      rows={2}
    />
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [themes, setThemes] = useState([]);
  const [view, setView] = useState({ page: "home", themeId: null, vitrineId: null });
  const [modal, setModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();
  const [pendingVitrine, setPendingVitrine] = useState(null);
  const themeCoverRef = useRef();
  const [pendingThemeCover, setPendingThemeCover] = useState(null);

  const isAdmin = !!user;

  // ── Auth listener ──
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);

  // ── Firestore real-time listeners ──
  const [vitrinesMap, setVitrinesMap] = useState({});
  const [photosMap, setPhotosMap] = useState({});

  // Listen to themes
  useEffect(() => {
    const q = query(collection(db, "themes"), orderBy("order"));
    return onSnapshot(q, snap => {
      setThemes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Listen to vitrines for each theme
  useEffect(() => {
    if (!themes.length) return;
    const unsubs = themes.map(t => {
      const q = query(collection(db, "themes", t.id, "vitrines"), orderBy("order"));
      return onSnapshot(q, snap => {
        setVitrinesMap(prev => ({
          ...prev,
          [t.id]: snap.docs.map(d => ({ id: d.id, ...d.data() }))
        }));
      });
    });
    return () => unsubs.forEach(u => u());
  }, [themes.map(t => t.id).join(",")]);

  // Listen to photos for each vitrine
  useEffect(() => {
    const allVitrines = Object.entries(vitrinesMap).flatMap(([tId, vs]) =>
      vs.map(v => ({ tId, vId: v.id }))
    );
    if (!allVitrines.length) return;
    const unsubs = allVitrines.map(({ tId, vId }) => {
      const q = query(collection(db, "themes", tId, "vitrines", vId, "photos"), orderBy("order"));
      return onSnapshot(q, snap => {
        setPhotosMap(prev => ({
          ...prev,
          [`${tId}_${vId}`]: snap.docs.map(d => ({ id: d.id, ...d.data() }))
        }));
      });
    });
    return () => unsubs.forEach(u => u());
  }, [JSON.stringify(Object.entries(vitrinesMap).flatMap(([tId, vs]) => vs.map(v => `${tId}_${v.id}`)))]);

  // Assemble full data tree
  const fullThemes = themes.map(t => ({
    ...t,
    vitrines: (vitrinesMap[t.id] || []).map(v => ({
      ...v,
      photos: photosMap[`${t.id}_${v.id}`] || []
    }))
  }));

  const theme = fullThemes.find(t => t.id === view.themeId);
  const vitrine = theme?.vitrines?.find(v => v.id === view.vitrineId);

  // ── Helpers ──
  const nextOrder = arr => (arr?.length ? Math.max(...arr.map(x => x.order || 0)) + 1 : 0);

  // ── Themes CRUD ──
  const addTheme = async ({ name, desc }) => {
    const id = `t_${Date.now()}`;
    await setDoc(doc(db, "themes", id), { name, desc, public: false, order: nextOrder(fullThemes) });
    setModal(null);
  };
  const editTheme = async (id, { name, desc }) => {
    await setDoc(doc(db, "themes", id), { name, desc }, { merge: true });
    setModal(null);
  };
  const deleteTheme = async (tId) => {
    await deleteDoc(doc(db, "themes", tId));
    if (view.themeId === tId) goHome();
  };
  const toggleThemePublic = async (tId, current) => {
    await setDoc(doc(db, "themes", tId), { public: !current }, { merge: true });
  };

  const setThemeCover = async (tId, file) => {
    try {
      const { url } = await uploadToCloudinary(file);
      await setDoc(doc(db, "themes", tId), { cover: url }, { merge: true });
    } catch {
      alert("Грешка при качване на корица.");
    }
  };

  // ── Vitrines CRUD ──
  const addVitrine = async ({ name, desc }) => {
    const id = `v_${Date.now()}`;
    const t = fullThemes.find(x => x.id === view.themeId);
    await setDoc(doc(db, "themes", view.themeId, "vitrines", id), {
      name, desc, public: false, cover: null, order: nextOrder(t?.vitrines)
    });
    setModal(null);
  };
  const editVitrine = async (vId, { name, desc }) => {
    await setDoc(doc(db, "themes", view.themeId, "vitrines", vId), { name, desc }, { merge: true });
    setModal(null);
  };
  const deleteVitrine = async (vId) => {
    await deleteDoc(doc(db, "themes", view.themeId, "vitrines", vId));
    if (view.vitrineId === vId) goTheme(view.themeId);
  };
  const toggleVitrinePublic = async (vId, current) => {
    await setDoc(doc(db, "themes", view.themeId, "vitrines", vId), { public: !current }, { merge: true });
  };

  // ── Photos ──
  const handleAddPhoto = (vitrineId) => { setPendingVitrine(vitrineId); fileRef.current.click(); };

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const v = theme?.vitrines?.find(x => x.id === pendingVitrine);
      for (let i = 0; i < files.length; i++) {
        const { url, publicId } = await uploadToCloudinary(files[i]);
        const id = `p_${Date.now()}_${i}`;
        await setDoc(doc(db, "themes", view.themeId, "vitrines", pendingVitrine, "photos", id), {
          url, publicId, desc: "", order: nextOrder(v?.photos) + i
        });
        // set cover if first photo
        if (!v?.cover && i === 0) {
          await setDoc(doc(db, "themes", view.themeId, "vitrines", pendingVitrine), { cover: url }, { merge: true });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Грешка при качване на снимката. Моля опитайте отново.");
    } finally {
      setUploading(false);
      e.target.value = "";
      setPendingVitrine(null);
    }
  };

  const updatePhotoDesc = async (photoId, desc) => {
    await setDoc(doc(db, "themes", view.themeId, "vitrines", view.vitrineId, "photos", photoId), { desc }, { merge: true });
  };

  const deletePhoto = async (photoId, photoUrl) => {
    await deleteDoc(doc(db, "themes", view.themeId, "vitrines", view.vitrineId, "photos", photoId));
    if (vitrine?.cover === photoUrl) {
      const remaining = vitrine.photos.filter(p => p.id !== photoId);
      await setDoc(doc(db, "themes", view.themeId, "vitrines", view.vitrineId), {
        cover: remaining[0]?.url || null
      }, { merge: true });
    }
  };

  const setCover = async (photoUrl) => {
    await setDoc(doc(db, "themes", view.themeId, "vitrines", view.vitrineId), { cover: photoUrl }, { merge: true });
  };

  const getThemeCover = (t) => {
    if (t.cover) return t.cover;
    for (const v of (t.vitrines || [])) {
      if (v.cover) return v.cover;
      if (v.photos?.length) return v.photos[0].url;
    }
    return null;
  };

  const goHome = () => setView({ page: "home", themeId: null, vitrineId: null });
  const goTheme = (id) => setView({ page: "theme", themeId: id, vitrineId: null });
  const goVitrine = (tId, vId) => setView({ page: "vitrine", themeId: tId, vitrineId: vId });

  // ── Visibility filter for guests ──
  const visibleThemes = isAdmin ? fullThemes : fullThemes.filter(t => t.public);
  const visibleVitrines = (t) => isAdmin ? (t?.vitrines || []) : (t?.vitrines || []).filter(v => v.public);

  const themeFields = [
    { key: "name", label: "Заглавие", required: true, placeholder: "напр. Порцеланови кукли" },
    { key: "desc", label: "Описание", type: "textarea", placeholder: "Кратко описание…" },
  ];
  const vitrineFields = [
    { key: "name", label: "Заглавие", required: true, placeholder: "напр. Витрина I — Бидермайер" },
    { key: "desc", label: "Описание", type: "textarea", placeholder: "Описание на витрината…" },
  ];

  // ── Loading state ──
  if (user === undefined) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontFamily: "var(--font-ui)", letterSpacing: ".1em" }}>
      <GlobalStyle />
      Зареждане…
    </div>
  );

  return (
    <>
      <GlobalStyle />
      <input type="file" accept="image/*" multiple ref={fileRef} style={{ display: "none" }} onChange={onFileChange} />
      <input type="file" accept="image/*" ref={themeCoverRef} style={{ display: "none" }} onChange={async e => {
        const file = e.target.files[0];
        if (!file || !pendingThemeCover) return;
        setUploading(true);
        await setThemeCover(pendingThemeCover, file);
        setUploading(false);
        setPendingThemeCover(null);
        e.target.value = "";
      }} />
      {showScrollTop && (
        <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Нагоре">↑</button>
      )}
      {lightbox && (
        <Lightbox photos={lightbox.photos} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
      {uploading && (
        <div className="upload-overlay">
          <div className="upload-box">
            <div className="upload-spinner" />
            Качване на снимки…
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <img src="/minimondo_logo.png" alt="Minimondo" className="app-logo-img" onClick={goHome} />
        <span className="app-logo-text" onClick={goHome}>Minimondo</span>
        {view.page !== "home" && <>
          <span className="app-logo-sep">›</span>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: ".72rem", letterSpacing: ".08em", color: "var(--muted)", textTransform: "uppercase" }}>
            {theme?.name}{vitrine ? ` › ${vitrine.name}` : ""}
          </span>
        </>}
        <div className="header-right">
          {isAdmin
            ? <button className="btn btn-ghost btn-sm" onClick={() => signOut(auth)}>Изход</button>
            : <button className="btn btn-ghost btn-sm" onClick={() => setModal("login")}>Вход</button>
          }
        </div>
      </header>

      <main className="main">

        {/* HOME */}
        {view.page === "home" && <>
          <div className="ornament"><div className="ornament-line" /><span>ТЕМИ</span><div className="ornament-line" /></div>
          <div className="page-header">
            <div>
              <div className="page-title">Лична колекция</div>
              <div className="page-subtitle">Разпределение по теми и витрини</div>
              <div style={{marginTop: "8px", fontFamily: "var(--font-ui)", fontSize: "0.7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)"}}>Всички теми</div>
            </div>
          </div>
          <div className="grid">
            {visibleThemes.map(t => (
              <div key={t.id} className={`tile${!t.public ? " hidden-tile" : ""}`}>
                {isAdmin && (
                  <div className="tile-controls">
                    <button className={`ctrl-btn ctrl-vis${t.public ? " is-public" : ""}`} title={t.public ? "Скрий" : "Публикувай"} onClick={e => { e.stopPropagation(); toggleThemePublic(t.id, t.public); }}>
                      {t.public ? "👁" : "🚫"}
                    </button>
                    <button className="ctrl-btn ctrl-edit" title="Редактирай" onClick={e => { e.stopPropagation(); setModal({ type: "editTheme", id: t.id }); }}>✎</button>
                    <button className="ctrl-btn ctrl-del" title="Изтрий" onClick={e => { e.stopPropagation(); deleteTheme(t.id); }}>✕</button>
                  </div>
                )}
                {isAdmin && !t.public && <span className="vis-badge hidden">Скрито</span>}
                {getThemeCover(t)
                  ? <img className="tile-img" src={getThemeCover(t)} alt={t.name} onClick={() => goTheme(t.id)} />
                  : <div className="tile-placeholder" onClick={() => goTheme(t.id)}>🏛️</div>}
                <div className="tile-label" onClick={() => goTheme(t.id)}>{t.name}</div>
                <div className="tile-count">{(t.vitrines || []).length} витрини</div>
              </div>
            ))}
            {isAdmin && (
              <button className="tile-add" onClick={() => setModal("newTheme")}>
                <div className="tile-add-inner">
                  <span className="tile-add-icon">＋</span>
                  <span className="tile-add-label">Нова тема</span>
                </div>
              </button>
            )}
          </div>
        </>}

        {/* THEME */}
        {view.page === "theme" && theme && <>
          <div className="ornament"><div className="ornament-line" /><span>ВИТРИНИ</span><div className="ornament-line" /></div>
          <button className="back-btn" onClick={goHome}>‹ Назад към теми</button>
          <div className="page-header">
            <div>
              <div className="page-title">{theme.name}</div>
              {theme.desc && <div className="page-subtitle">{theme.desc}</div>}
            </div>
            {isAdmin && (
              <div className="page-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setPendingThemeCover(theme.id); themeCoverRef.current.click(); }}>🖼 Корица на тема</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: "editTheme", id: theme.id })}>✎ Редактирай тема</button>
              </div>
            )}
          </div>
          <div className="grid">
            {visibleVitrines(theme).map(v => (
              <div key={v.id} className={`tile${!v.public ? " hidden-tile" : ""}`}>
                {isAdmin && (
                  <div className="tile-controls">
                    <button className={`ctrl-btn ctrl-vis${v.public ? " is-public" : ""}`} title={v.public ? "Скрий" : "Публикувай"} onClick={e => { e.stopPropagation(); toggleVitrinePublic(v.id, v.public); }}>
                      {v.public ? "👁" : "🚫"}
                    </button>
                    <button className="ctrl-btn ctrl-edit" title="Редактирай" onClick={e => { e.stopPropagation(); setModal({ type: "editVitrine", id: v.id }); }}>✎</button>
                    <button className="ctrl-btn ctrl-del" title="Изтрий" onClick={e => { e.stopPropagation(); deleteVitrine(v.id); }}>✕</button>
                  </div>
                )}
                {isAdmin && !v.public && <span className="vis-badge hidden">Скрито</span>}
                {v.cover || v.photos?.[0]?.url
                  ? <img className="tile-img" src={v.cover || v.photos[0].url} alt={v.name} onClick={() => goVitrine(theme.id, v.id)} />
                  : <div className="tile-placeholder" onClick={() => goVitrine(theme.id, v.id)}>🪆</div>}
                <div className="tile-label" onClick={() => goVitrine(theme.id, v.id)}>{v.name}</div>
                <div className="tile-count">{(v.photos || []).length} снимки</div>
              </div>
            ))}
            {isAdmin && (
              <button className="tile-add" onClick={() => setModal("newVitrine")}>
                <div className="tile-add-inner">
                  <span className="tile-add-icon">＋</span>
                  <span className="tile-add-label">Нова витрина</span>
                </div>
              </button>
            )}
          </div>
        </>}

        {/* VITRINE */}
        {view.page === "vitrine" && vitrine && <>
          <div className="ornament"><div className="ornament-line" /><span>СНИМКИ</span><div className="ornament-line" /></div>
          <button className="back-btn" onClick={() => goTheme(theme.id)}>‹ Назад към {theme.name}</button>
          <div className="page-header">
            <div>
              <div className="page-title">{vitrine.name}</div>
              {vitrine.desc && <div className="page-subtitle">{vitrine.desc}</div>}
            </div>
            {isAdmin && (
              <div className="page-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: "editVitrine", id: vitrine.id })}>✎ Редактирай витрина</button>
                <button className="btn btn-primary" onClick={() => handleAddPhoto(vitrine.id)}>+ Добави снимки</button>
              </div>
            )}
          </div>
          <div className="photo-grid">
            {(vitrine.photos || []).map((p, i) => {
              const isCover = vitrine.cover === p.url;
              return (
                <div key={p.id} className="photo-card">
                  {isAdmin && (
                    <div className="photo-controls">
                      <button className="ctrl-btn ctrl-del" title="Изтрий" onClick={() => deletePhoto(p.id, p.url)}>✕</button>
                    </div>
                  )}
                  <img src={p.url} alt={p.desc || "снимка"} onClick={() => setLightbox({ photos: vitrine.photos, index: i })} />
                  {isAdmin && (isCover
                    ? <span className="cover-badge">★ Корица</span>
                    : <button className="cover-set-btn" onClick={() => setCover(p.url)}>Задай корица</button>
                  )}
                  {isAdmin
                    ? <PhotoDesc key={p.id} photoId={p.id} initialDesc={p.desc} onSave={updatePhotoDesc} />
                    : p.desc ? <div className="photo-desc-view">{p.desc}</div> : null
                  }
                </div>
              );
            })}
            {!(vitrine.photos?.length) && (
              <div style={{ color: "var(--muted)", fontStyle: "italic", fontFamily: "var(--font-body)", gridColumn: "1/-1", padding: "24px 0" }}>
                {isAdmin ? "Все още няма снимки. Добавете първата снимка с бутона горе." : "Все още няма снимки в тази витрина."}
              </div>
            )}
          </div>
        </>}
      </main>

      {/* MODALS */}
      {modal === "login" && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <LoginScreen onLogin={() => setModal(null)} />
          </div>
        </div>
      )}
      {modal === "newTheme" && (
        <Modal title="Нова тема" confirmLabel="Създай" fields={themeFields}
          onConfirm={addTheme} onClose={() => setModal(null)} />
      )}
      {modal === "newVitrine" && (
        <Modal title="Нова витрина" confirmLabel="Създай" fields={vitrineFields}
          onConfirm={addVitrine} onClose={() => setModal(null)} />
      )}
      {modal?.type === "editTheme" && (() => {
        const t = fullThemes.find(x => x.id === modal.id);
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
