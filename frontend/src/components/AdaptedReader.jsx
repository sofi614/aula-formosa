import { useEffect, useRef, useState } from 'react';
import { Modal } from './ui.jsx';
import { FILE_BASE } from '../lib/api.js';

// Panel de opciones portado del prototipo "Lector Claro": deja elegir
// tipografía, tamaño, espaciados, fondo/contraste y cómo se arma el texto
// (una frase por renglón, tramos, números resaltados, regla de lectura).
// El HTML adaptado ya viene armado del backend (dyslexia.helper.js, con el
// mismo criterio del prototipo); acá solo se cambia cómo se lo muestra.

const THEMES = [
  { name: 'Crema', bg: '#FBF5E6', fg: '#2B2B2B' },
  { name: 'Durazno', bg: '#FCE9D6', fg: '#2E2420' },
  { name: 'Menta', bg: '#E3F2E7', fg: '#1E2C24' },
  { name: 'Celeste', bg: '#E2ECF7', fg: '#1B2533' },
  { name: 'Gris', bg: '#E9E9E6', fg: '#222222' },
  { name: 'Noche', bg: '#1F2326', fg: '#E8E3D6' },
];

const FONTS = [
  { value: "'Lexend', var(--font-ui)", label: 'Lexend' },
  { value: "'OpenDyslexicLocal','OpenDyslexic','Lexend',var(--font-ui)", label: 'OpenDyslexic (si está instalada)' },
  { value: "'Atkinson Hyperlegible', var(--font-ui)", label: 'Atkinson Hyperlegible' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica' },
];

// Configuración fija de la vista "Adaptado" (la recomendada, no se toca).
const FIXED = {
  font: FONTS[0].value, size: 20, ls: 0.22, ws: 0.52, lh: 2, w: 65,
  bg: '#FBF5E6', fg: '#2B2B2B', ruler: false,
  perLine: true, chunks: true, nums: true,
};
const DEFAULTS = { ...FIXED, rate: 0.9 };

const STORAGE_KEY = 'aula-lector-claro-ajustes';

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved ? { ...DEFAULTS, ...saved } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

// Contraste WCAG entre fondo y texto, para avisar si la combinación elegida
// se lee bien o no.
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrastRatio(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export default function AdaptedReader({ post, onClose }) {
  const [view, setView] = useState('adapted'); // 'adapted' (fijo) | 'adjust' (panel)
  const [settings, setSettings] = useState(loadSettings);
  const [speaking, setSpeaking] = useState(false);
  const pageRef = useRef(null);
  const rulerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage puede fallar (privado, cuota); no rompe la lectura.
    }
  }, [settings]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const adjusting = view === 'adjust';
  const active = adjusting ? settings : FIXED;

  const pageStyle = {
    '--r-font': active.font,
    '--r-size': `${active.size}px`,
    '--r-ls': `${active.ls}em`,
    '--r-ws': `${active.ws}em`,
    '--r-lh': active.lh,
    '--r-w': `${active.w}ch`,
    '--r-bg': active.bg,
    '--r-fg': active.fg,
  };

  const ratio = contrastRatio(settings.bg, settings.fg);
  const ratioLabel = ratio >= 7 ? 'Muy bueno (AAA)' : ratio >= 4.5 ? 'Suficiente (AA)' : 'Bajo: difícil de leer';
  const ratioClass = ratio >= 4.5 ? 'text-success' : 'text-warning';

  const stop = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    const container = document.getElementById('lc-reading-content');
    const text = container ? container.textContent : '';
    if (!text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-AR';
    u.rate = adjusting ? settings.rate : 0.9;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const toggleSpeak = () => (speaking ? stop() : speak());

  const changeView = (v) => {
    stop();
    setView(v);
  };

  const onRulerMove = (e) => {
    if (!adjusting || !settings.ruler || !rulerRef.current || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    rulerRef.current.style.top = `${e.clientY - rect.top}px`;
  };

  return (
    <Modal title={`Adaptado para dislexia · ${post.fileName}`} onClose={() => { stop(); onClose(); }} size="xl">
      <div className="lc-toolbar">
        <span className="lc-tag"><i className="bi bi-stars" aria-hidden="true" /> Reorganizado automáticamente, sin cambiar el contenido</span>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={toggleSpeak}>
            <i className={`bi ${speaking ? 'bi-stop-circle' : 'bi-volume-up'}`} aria-hidden="true" /> {speaking ? 'Detener' : 'Escuchar'}
          </button>
          {post.fileUrl && (
            <a className="btn btn-sm btn-outline-secondary" href={`${FILE_BASE}${post.fileUrl}`} target="_blank" rel="noopener noreferrer">
              <i className="bi bi-download" aria-hidden="true" /> Archivo original
            </a>
          )}
        </div>
      </div>

      <div className="lc-viewbar">
        <div className="btn-group" role="group" aria-label="Versión del texto">
          <button type="button" className={`btn btn-sm ${!adjusting ? 'btn-primary' : 'btn-outline-secondary'}`} aria-pressed={!adjusting} onClick={() => changeView('adapted')}>
            Adaptado
          </button>
          <button type="button" className={`btn btn-sm ${adjusting ? 'btn-primary' : 'btn-outline-secondary'}`} aria-pressed={adjusting} onClick={() => changeView('adjust')}>
            Ajustable
          </button>
        </div>
        {adjusting && <span className="lc-hint">Elegí fuente, tamaño, colores y cómo se arma el texto.</span>}
      </div>

      <div className={`lc-layout ${adjusting ? 'with-panel' : ''}`}>
        {adjusting && (
          <aside className="lc-panel" aria-label="Ajustes de lectura">
            <fieldset className="lc-fieldset">
              <legend>1 · Fuente</legend>
              <label className="form-label small fw-bold mb-0" htmlFor="lc-font">Tipografía</label>
              <select id="lc-font" className="form-select form-select-sm" value={settings.font} onChange={(e) => set({ font: e.target.value })}>
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <label className="form-label small fw-bold d-flex justify-content-between mb-0 mt-2" htmlFor="lc-size">
                Tamaño <span className="fw-normal text-muted-strong">{settings.size} px</span>
              </label>
              <input id="lc-size" type="range" className="form-range" min="14" max="36" step="1" value={settings.size} onChange={(e) => set({ size: +e.target.value })} />
            </fieldset>

            <fieldset className="lc-fieldset">
              <legend>2 · Espaciado</legend>
              <label className="form-label small fw-bold d-flex justify-content-between mb-0" htmlFor="lc-ls">
                Entre letras <span className="fw-normal text-muted-strong">{settings.ls.toFixed(2)} em</span>
              </label>
              <input id="lc-ls" type="range" className="form-range" min="0" max="0.35" step="0.01" value={settings.ls} onChange={(e) => set({ ls: +e.target.value })} />
              <label className="form-label small fw-bold d-flex justify-content-between mb-0" htmlFor="lc-ws">
                Entre palabras <span className="fw-normal text-muted-strong">{settings.ws.toFixed(2)} em</span>
              </label>
              <input id="lc-ws" type="range" className="form-range" min="0" max="0.8" step="0.02" value={settings.ws} onChange={(e) => set({ ws: +e.target.value })} />
              <label className="form-label small fw-bold d-flex justify-content-between mb-0" htmlFor="lc-lh">
                Interlineado <span className="fw-normal text-muted-strong">{settings.lh.toFixed(2)}</span>
              </label>
              <input id="lc-lh" type="range" className="form-range" min="1.2" max="2.8" step="0.05" value={settings.lh} onChange={(e) => set({ lh: +e.target.value })} />
              <label className="form-label small fw-bold d-flex justify-content-between mb-0" htmlFor="lc-w">
                Ancho de línea <span className="fw-normal text-muted-strong">{settings.w} caracteres</span>
              </label>
              <input id="lc-w" type="range" className="form-range" min="40" max="90" step="1" value={settings.w} onChange={(e) => set({ w: +e.target.value })} />
              <button type="button" className="btn btn-sm btn-outline-secondary mt-1" onClick={() => set({ size: 20, ls: 0.22, ws: 0.52, lh: 2, w: 65 })}>
                Volver al espaciado recomendado
              </button>
            </fieldset>

            <fieldset className="lc-fieldset">
              <legend>3 · Fondo y contraste</legend>
              <div className="lc-swatches" role="group" aria-label="Combinaciones de color">
                {THEMES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    className="lc-swatch"
                    style={{ background: t.bg, color: t.fg }}
                    aria-pressed={t.bg.toLowerCase() === settings.bg.toLowerCase() && t.fg.toLowerCase() === settings.fg.toLowerCase()}
                    onClick={() => set({ bg: t.bg, fg: t.fg })}
                  >
                    <span className="lc-aa">Aa</span>{t.name}
                  </button>
                ))}
              </div>
              <div className="d-flex gap-2">
                <label className="flex-fill small mb-0">
                  Fondo
                  <input type="color" className="form-control form-control-color w-100" value={settings.bg} onChange={(e) => set({ bg: e.target.value })} />
                </label>
                <label className="flex-fill small mb-0">
                  Texto
                  <input type="color" className="form-control form-control-color w-100" value={settings.fg} onChange={(e) => set({ fg: e.target.value })} />
                </label>
              </div>
              <p className="small mb-0">
                Contraste <strong>{ratio.toFixed(1)} : 1</strong> <span className={`fw-bold ${ratioClass}`}>{ratioLabel}</span>
              </p>
              <p className="lc-hint mb-0">Conviene evitar blanco puro y negro puro: un fondo crema o pastel con texto gris oscuro reduce el deslumbramiento.</p>
            </fieldset>

            <fieldset className="lc-fieldset">
              <legend>4 · Cómo se arma el texto</legend>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="lc-perline" checked={settings.perLine} onChange={(e) => set({ perLine: e.target.checked })} />
                <label className="form-check-label" htmlFor="lc-perline">Una frase por renglón</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="lc-chunks" checked={settings.chunks} onChange={(e) => set({ chunks: e.target.checked })} />
                <label className="form-check-label" htmlFor="lc-chunks">Cortar frases largas en tramos</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="lc-nums" checked={settings.nums} onChange={(e) => set({ nums: e.target.checked })} />
                <label className="form-check-label" htmlFor="lc-nums">Resaltar números, fechas y plazos</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="lc-ruler" checked={settings.ruler} onChange={(e) => set({ ruler: e.target.checked })} />
                <label className="form-check-label" htmlFor="lc-ruler">Regla de lectura</label>
              </div>
              <label className="form-label small fw-bold d-flex justify-content-between mb-0 mt-1" htmlFor="lc-rate">
                Velocidad de la voz <span className="fw-normal text-muted-strong">{settings.rate.toFixed(2)}×</span>
              </label>
              <input id="lc-rate" type="range" className="form-range" min="0.6" max="1.4" step="0.05" value={settings.rate} onChange={(e) => set({ rate: +e.target.value })} />
            </fieldset>

            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSettings({ ...DEFAULTS })}>
              Restablecer todo a lo recomendado
            </button>
          </aside>
        )}

        <div className="lc-page" ref={pageRef} style={pageStyle} onMouseMove={onRulerMove}>
          {adjusting && settings.ruler && <div className="lc-ruler" ref={rulerRef} />}
          <article
            id="lc-reading-content"
            className={`lc-reading ${active.perLine ? 'per-line' : ''} ${active.chunks ? 'chunks' : ''} ${active.nums ? 'nums' : ''}`}
            dangerouslySetInnerHTML={{ __html: post.fileAdapted }}
          />
        </div>
      </div>
    </Modal>
  );
}
