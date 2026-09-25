import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Avatar, PROFILE_META } from './ui.jsx';
import { CVD_INFO, CVD_THEME } from '../lib/cvd.js';

export default function Navbar() {
  const { user, logout, updateUser } = useStore();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const isStudent = user.role === 'student';
  const hasFilter = isStudent && user.profile === 'daltonismo' && user.cvdType && CVD_THEME[user.cvdType];
  const isMono = user.cvdType === 'acromatopsia';
  const filterOn = user.prefs?.filterOn !== false;

  return (
    <header className="app-navbar">
      <div className="container d-flex align-items-center justify-content-between gap-3">
        <Link to="/" className="brand-link">
          <i className="bi bi-mortarboard-fill" aria-hidden="true" /> Aula Inclusiva
        </Link>

        <div className="d-flex align-items-center gap-2 position-relative">
          {isStudent && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              <i className="bi bi-universal-access-circle" aria-hidden="true" /> Accesibilidad
            </button>
          )}

          {open && isStudent && (
            <div className="access-panel" role="dialog" aria-label="Opciones de accesibilidad">
              <p className="mb-2 fw-bold">
                <i className={`bi ${PROFILE_META[user.profile].icon}`} aria-hidden="true" /> {PROFILE_META[user.profile].label}
              </p>
              {hasFilter ? (
                <>
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="filterSwitch"
                      checked={filterOn}
                      onChange={() => updateUser({ prefs: { ...user.prefs, filterOn: !filterOn } })}
                    />
                    <label className="form-check-label" htmlFor="filterSwitch">
                      {isMono ? 'Escala de grises + bajar brillo' : 'Paleta adaptada a mi tipo'}
                      <small className="text-muted d-block">{CVD_INFO[user.cvdType].label}</small>
                    </label>
                  </div>
                  <button className="btn btn-sm btn-link p-0" onClick={() => { setOpen(false); nav('/test-daltonismo'); }}>
                    Repetir el test de color
                  </button>
                </>
              ) : (
                <p className="small text-muted mb-0">{PROFILE_META[user.profile].desc} Se aplica automáticamente en cada publicación.</p>
              )}
            </div>
          )}

          <div className="user-chip">
            <Avatar name={user.name} size={32} />
            <span className="d-none d-sm-block">
              <strong>{user.name}</strong>
              <small>{user.role === 'teacher' ? 'Profesor' : 'Alumno'}</small>
            </span>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={async () => { await logout(); nav('/login'); }}>
            <i className="bi bi-box-arrow-right" aria-hidden="true" /> Salir
          </button>
        </div>
      </div>
    </header>
  );
}
