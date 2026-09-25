import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Modal, COURSE_COLORS, COURSE_ICONS, PROFILE_META } from '../components/ui.jsx';

export default function StudentHome() {
  const { user, myCourses, joinCourse, loadCourses, coursesLoading } = useStore();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setJoining(true);
    const res = await joinCourse(code);
    setJoining(false);
    if (!res.ok) return setError(res.error);
    setOk(`Te uniste a ${res.course.name}.`);
    setCode('');
    setOpen(false);
  };

  const profile = PROFILE_META[user.profile];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tus materias</h1>
          <p>
            <i className={`bi ${profile.icon}`} aria-hidden="true" /> Contenido adaptado para: <strong>{profile.short}</strong>
          </p>
        </div>
        <button className="btn btn-primary text-white" onClick={() => setOpen(true)}>
          <i className="bi bi-key" aria-hidden="true" /> Unirme con un código
        </button>
      </div>

      {ok && (
        <div className="auth-alert ok" role="status">
          <i className="bi bi-check-circle-fill" aria-hidden="true" />
          <span>{ok} <button type="button" className="btn btn-sm btn-link" onClick={() => setOk('')}>Cerrar</button></span>
        </div>
      )}

      {coursesLoading && myCourses.length === 0 ? (
        <p className="text-muted-strong">Cargando tus materias…</p>
      ) : myCourses.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-backpack2" aria-hidden="true" />
          <p className="mb-1"><strong>Todavía no estás en ninguna materia.</strong></p>
          <p className="mb-3">Pedile el código a tu profesor y sumate con el botón de arriba.</p>
          <button className="btn btn-primary text-white" onClick={() => setOpen(true)}>Unirme con un código</button>
        </div>
      ) : (
        <div className="course-grid">
          {myCourses.map((c) => (
            <Link key={c.id} to={`/materia/${c.id}`} className="course-card">
              <div className="course-banner" style={{ background: COURSE_COLORS[c.color % COURSE_COLORS.length] }}>
                <i className={`bi ${COURSE_ICONS[c.icon % COURSE_ICONS.length]}`} aria-hidden="true" />
              </div>
              <div className="course-body">
                <h3>{c.name}</h3>
                <p>Profesor/a: {c.teacherName || '—'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Unirme a una materia" onClose={() => setOpen(false)}>
          {error && (
            <div className="auth-alert" role="alert">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> <span>{error}</span>
            </div>
          )}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="code">Código de la materia</label>
              <input id="code" className="form-control text-uppercase" required autoFocus maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ej: BIO2A7" />
              <div className="form-text">Te lo comparte tu profesor cuando crea la materia.</div>
            </div>
            <button type="submit" className="btn btn-primary text-white w-100" disabled={joining}>
              {joining ? 'Uniéndote…' : 'Unirme'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
