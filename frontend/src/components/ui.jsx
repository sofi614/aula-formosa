export const PROFILE_META = {
  comprension: { label: 'Problemas de comprensión', short: 'Comprensión', icon: 'bi-chat-square-text', desc: 'Textos más cortos, resúmenes y pasos claros.' },
  dislexia: { label: 'Dislexia', short: 'Dislexia', icon: 'bi-fonts', desc: 'Tipografía legible, más espacio y lectura en voz alta.' },
  daltonismo: { label: 'Daltonismo', short: 'Daltonismo', icon: 'bi-palette', desc: 'Test de color (deuteranopía, protanopía, tritanopía o acromatopsia) y una interfaz adaptada al resultado.' },
  ninguno: { label: 'Ninguna por ahora', short: 'Sin adaptación', icon: 'bi-person-check', desc: 'Ves el contenido tal cual lo publica el profesor.' },
};

// Colores seguros para daltonismo (paleta Okabe-Ito) + un ícono distinto por materia
export const COURSE_COLORS = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00'];
export const COURSE_ICONS = ['bi-flower1', 'bi-calculator', 'bi-globe-americas', 'bi-book', 'bi-lightbulb', 'bi-music-note-beamed'];

export const fmtDate = (t) => new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
export const fmtDateTime = (t) =>
  new Date(t).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtDue = (s) =>
  s ? new Date(s + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Sin fecha';

export function Avatar({ name, size = 36 }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {initials}
    </span>
  );
}

export function ProfileBadge({ profile }) {
  const m = PROFILE_META[profile];
  if (!m) return null;
  return (
    <span className="profile-badge">
      <i className={`bi ${m.icon}`} aria-hidden="true" /> {m.short}
    </span>
  );
}

export function Modal({ title, onClose, children, size }) {
  return (
    <>
      <div
        className="modal d-block"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size ? `modal-${size}` : ''}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">{title}</h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}

export function ChoiceCard({ selected, onClick, icon, title, desc }) {
  return (
    <button type="button" role="radio" aria-checked={selected} className={`choice-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <i className={`bi ${icon} choice-icon`} aria-hidden="true" />
      <span className="choice-text">
        <strong>{title}</strong>
        {desc && <small>{desc}</small>}
      </span>
      <i className={`bi ${selected ? 'bi-check-circle-fill' : 'bi-circle'} choice-check`} aria-hidden="true" />
    </button>
  );
}
