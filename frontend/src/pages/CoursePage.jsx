import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { Modal, COURSE_COLORS, COURSE_ICONS, fmtDateTime, fmtDue, Avatar } from '../components/ui.jsx';
import AdaptedReader from '../components/AdaptedReader.jsx';

const TYPE_META = {
  aviso: { label: 'Aviso', pill: 'pill-aviso', icon: 'bi-megaphone' },
  teoria: { label: 'Marco teórico', pill: 'pill-teoria', icon: 'bi-journal-text' },
  tarea: { label: 'Tarea', pill: 'pill-tarea', icon: 'bi-clipboard-check' },
};

export default function CoursePage() {
  // Los ids de la API son numéricos; el parámetro de la URL siempre llega
  // como string, así que lo convertimos una sola vez acá.
  const courseId = Number(useParams().courseId);
  const { db, user, createPost, loadCourseDetail, courseDetailLoading, courseDetailError } = useStore();
  const course = db.courses.find((c) => c.id === courseId);
  const [openNew, setOpenNew] = useState(false);

  useEffect(() => { loadCourseDetail(courseId); }, [courseId, loadCourseDetail]);

  const posts = useMemo(
    () => db.posts.filter((p) => p.courseId === courseId).sort((a, b) => b.createdAt - a.createdAt),
    [db.posts, courseId]
  );

  if (!course) {
    if (courseDetailLoading) {
      return <div className="page"><p className="text-muted-strong">Cargando materia…</p></div>;
    }
    return (
      <div className="page">
        <p>{courseDetailError || 'No encontramos esa materia.'}</p>
        <Link to="/inicio">Volver al inicio</Link>
      </div>
    );
  }

  const isTeacher = user.role === 'teacher';

  return (
    <div className="page">
      <div className="course-banner mb-3" style={{ background: COURSE_COLORS[course.color % COURSE_COLORS.length], borderRadius: 14 }}>
        <i className={`bi ${COURSE_ICONS[course.icon % COURSE_ICONS.length]} me-2`} style={{ fontSize: '1.6rem' }} aria-hidden="true" />
        <div>
          <div className="fw-bold" style={{ fontSize: '1.15rem' }}>{course.name}</div>
          <div className="small" style={{ opacity: 0.9 }}>
            {isTeacher ? `Código para tus alumnos: ${course.code}` : `Profesor/a: ${course.teacherName || '—'}`}
          </div>
        </div>
      </div>

      <div className="page-header">
        <p className="mb-0 text-muted-strong">
          {course.description || 'Avisos, marcos teóricos y tareas de la materia.'}
        </p>
        {isTeacher && (
          <button className="btn btn-primary text-white" onClick={() => setOpenNew(true)}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> Nueva publicación
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox" aria-hidden="true" />
          <p className="mb-0">
            {isTeacher ? 'Todavía no publicaste nada en esta materia.' : 'Tu profesor todavía no publicó nada acá.'}
          </p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} course={course} isTeacher={isTeacher} />)
      )}

      {openNew && <NewPostModal courseId={course.id} onClose={() => setOpenNew(false)} createPost={createPost} />}
    </div>
  );
}

const TASK_FILE_TYPES = '.pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function NewPostModal({ courseId, onClose, createPost }) {
  const [type, setType] = useState('aviso');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const pickFile = (f) => {
    setFileError('');
    if (!f) return setFile(null);
    const okExt = /\.(pdf|docx?)$/i.test(f.name);
    if (!okExt) {
      setFile(null);
      setFileError('Solo se aceptan archivos PDF o Word (.docx).');
      return;
    }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setError('');
    setSaving(true);
    try {
      await createPost({
        courseId, type, title: title.trim(), body: body.trim(),
        dueDate: type === 'tarea' ? dueDate : '',
        file: type === 'tarea' ? file : null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title="Nueva publicación" onClose={onClose}>
      {error && (
        <div className="auth-alert" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> <span>{error}</span>
        </div>
      )}
      <form onSubmit={submit}>
        <div className="mb-3">
          <span className="form-label d-block">Tipo de publicación</span>
          <div className="d-flex gap-2">
            {Object.entries(TYPE_META).map(([key, m]) => (
              <button key={key} type="button" className="btn btn-outline-secondary flex-fill"
                style={type === key ? { borderColor: 'var(--ink)', background: 'var(--ink)', color: '#fff' } : undefined}
                onClick={() => setType(key)}>
                <i className={`bi ${m.icon}`} aria-hidden="true" /> {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="ptitle">Título</label>
          <input id="ptitle" className="form-control" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="pbody">Contenido</label>
          <textarea id="pbody" className="form-control" rows={5} required value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Escribí el contenido tal como lo pensás explicar en clase. La IA lo va a adaptar para cada alumno." />
        </div>
        {type === 'tarea' && (
          <>
            <div className="mb-3">
              <label className="form-label" htmlFor="pdue">Fecha de entrega</label>
              <input id="pdue" type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="pfile">Adjuntar tarea en PDF o Word (opcional)</label>
              <input id="pfile" type="file" className="form-control" accept={TASK_FILE_TYPES}
                onChange={(e) => pickFile(e.target.files?.[0] || null)} />
              <div className="form-text">
                Se procesa automáticamente: el contenido del archivo queda disponible para el alumno en una versión
                reorganizada para dislexia (letra más legible, frases más cortas, un renglón por idea).
              </div>
              {file && <div className="post-attach mt-2"><i className="bi bi-paperclip" aria-hidden="true" /> {file.name}</div>}
              {fileError && <div className="small mt-1" style={{ color: 'var(--bad-fg)' }}>{fileError}</div>}
            </div>
          </>
        )}
        <button type="submit" className="btn btn-primary text-white w-100" disabled={saving}>
          <i className="bi bi-send" aria-hidden="true" /> {saving ? 'Publicando…' : 'Publicar'}
        </button>
      </form>
    </Modal>
  );
}

function PostCard({ post, course, isTeacher }) {
  const { user } = useStore();
  const meta = TYPE_META[post.type];
  const [showReader, setShowReader] = useState(false);
  // El botón "Adaptado" (y la vista de lectura para dislexia) solo se
  // muestra al alumno con ese perfil, que es para quien está pensado; el
  // profesor también lo ve, para poder revisar qué es lo que ve el alumno.
  // El resto de los alumnos, si el archivo existe, solo ve el adjunto normal.
  const canSeeAdapted = isTeacher || user.profile === 'dislexia';
  const hasAdaptedFile = Boolean(post.fileUrl && post.fileAdapted) && canSeeAdapted;
  return (
    <article className="post-card">
      <div className="post-kicker">
        <span className={`post-type-pill ${meta.pill}`}>
          <i className={`bi ${meta.icon}`} aria-hidden="true" /> {meta.label}
        </span>
        <span>{fmtDateTime(post.createdAt)}</span>
        {post.type === 'tarea' && post.dueDate && <span className="post-due">· Entrega: {fmtDue(post.dueDate)}</span>}
      </div>
      <h3>{post.title}</h3>

      <PostContent post={post} isTeacher={isTeacher} />

      {hasAdaptedFile ? (
        <button type="button" className="file-adapt-btn" onClick={() => setShowReader(true)}>
          <i className={`bi ${post.fileType === 'docx' ? 'bi-file-earmark-word-fill' : 'bi-file-earmark-pdf-fill'}`} aria-hidden="true" />
          <span className="file-adapt-name">{post.fileName}</span>
          <span className="file-adapt-badge"><i className="bi bi-stars" aria-hidden="true" /> Adaptado</span>
        </button>
      ) : (
        post.fileName && (
          <div className="post-attach"><i className="bi bi-paperclip" aria-hidden="true" /> {post.fileName}</div>
        )
      )}

      {showReader && <AdaptedReader post={post} onClose={() => setShowReader(false)} />}

      {post.type === 'tarea' && !isTeacher && <SubmissionBox post={post} />}
      {post.type === 'tarea' && isTeacher && <TeacherSubmissions post={post} />}

      <CommentsSection post={post} isTeacher={isTeacher} />
    </article>
  );
}

function PostContent({ post, isTeacher }) {
  const { user } = useStore();

  if (isTeacher) {
    return <p className="post-body mb-0" style={{ whiteSpace: 'pre-wrap' }}>{post.body}</p>;
  }

  if (post.adaptStatus === 'pending' || !post.adapted) {
    return (
      <div className="adapt-loading">
        <i className="bi bi-arrow-repeat spin" aria-hidden="true" />
        Adaptando este contenido a tu perfil con IA…
      </div>
    );
  }

  const a = post.adapted;
  const sourceLabel = a.source === 'n8n' ? 'Adaptado con IA (n8n)' : 'Adaptado automáticamente';

  if (user.profile === 'comprension') {
    return (
      <div>
        <span className="adapt-tag"><i className="bi bi-stars" aria-hidden="true" /> {sourceLabel}</span>
        <div className="comp-summary">{a.comprension.summary}</div>
        <ul className="comp-points">
          {a.comprension.points.map((pt, idx) => <li key={idx}>{pt}</li>)}
        </ul>
      </div>
    );
  }

  if (user.profile === 'dislexia') {
    const speak = () => {
      if (!('speechSynthesis' in window)) return;
      const text = a.dislexia.paragraphs.join('. ');
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-AR';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    };
    return (
      <div className="dyslexia-mode">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="adapt-tag"><i className="bi bi-stars" aria-hidden="true" /> {sourceLabel}</span>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={speak}>
            <i className="bi bi-volume-up" aria-hidden="true" /> Escuchar
          </button>
        </div>
        {a.dislexia.paragraphs.map((p, idx) => <p key={idx}>{p}</p>)}
      </div>
    );
  }

  if (user.profile === 'daltonismo') {
    const tagLabel = user.cvdType === 'acromatopsia' ? 'Interfaz en escala de grises' : 'Paleta adaptada a tu tipo de daltonismo';
    return (
      <div>
        <span className="adapt-tag"><i className="bi bi-stars" aria-hidden="true" /> {tagLabel}</span>
        {a.daltonismo.paragraphs.map((p, idx) => <p key={idx} className="post-body">{p}</p>)}
      </div>
    );
  }

  return <p className="post-body mb-0" style={{ whiteSpace: 'pre-wrap' }}>{post.body}</p>;
}

function SubmissionBox({ post }) {
  const { db, user, submitTask } = useStore();
  const existing = db.submissions.find((s) => s.postId === post.id && s.studentId === user.id);
  const [text, setText] = useState(existing?.text || '');
  const [fileName, setFileName] = useState(existing?.fileName || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    setSaving(true);
    try {
      await submitTask({ postId: post.id, text: text.trim(), fileName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
      <h4 className="h6 mb-2">
        {existing ? 'Tu entrega' : 'Entregar esta tarea'}
        {existing?.grade != null && <span className="grade-pill ms-2">Nota: {existing.grade}</span>}
        {existing && existing.grade == null && <span className="grade-pill pending ms-2">Entregado · sin calificar</span>}
      </h4>
      {existing?.feedback && (
        <p className="small mb-2"><i className="bi bi-chat-left-text" aria-hidden="true" /> Comentario del profesor: {existing.feedback}</p>
      )}
      <form onSubmit={submit}>
        <textarea className="form-control mb-2" rows={3} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Escribí tu desarrollo acá..." />
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <input type="file" className="form-control" style={{ maxWidth: 260 }} onChange={(e) => setFileName(e.target.files?.[0]?.name || fileName)} />
          <button type="submit" className="btn btn-primary text-white" disabled={saving}>
            <i className="bi bi-upload" aria-hidden="true" /> {saving ? 'Enviando…' : existing ? 'Actualizar entrega' : 'Entregar'}
          </button>
          {saved && <span className="small" style={{ color: 'var(--moss-dark)' }}>Guardado ✓</span>}
          {error && <span className="small" style={{ color: 'var(--bad-fg)' }}>{error}</span>}
        </div>
        {fileName && <div className="post-attach mt-2"><i className="bi bi-paperclip" aria-hidden="true" /> {fileName}</div>}
      </form>
    </div>
  );
}

function TeacherSubmissions({ post }) {
  const { db, gradeSubmission } = useStore();
  const subs = db.submissions.filter((s) => s.postId === post.id);
  const [open, setOpen] = useState(false);

  if (subs.length === 0) {
    return <p className="small text-muted-strong mt-3 mb-0">Todavía nadie entregó esta tarea.</p>;
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
      <button type="button" className="btn btn-sm btn-link px-0" onClick={() => setOpen((o) => !o)}>
        <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" /> {subs.length} entrega{subs.length === 1 ? '' : 's'}
      </button>
      {open && subs.map((s) => <GradeRow key={s.id} sub={s} gradeSubmission={gradeSubmission} />)}
    </div>
  );
}

function GradeRow({ sub, gradeSubmission }) {
  const { db } = useStore();
  const student = db.users.find((u) => u.id === sub.studentId);
  const [grade, setGrade] = useState(sub.grade ?? '');
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (grade === '') return;
    setError('');
    setSaving(true);
    try {
      await gradeSubmission(sub.id, { grade: Number(grade), feedback });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="submission-row">
      <div className="d-flex align-items-center gap-2 mb-1">
        <Avatar name={student?.name || '?'} size={28} />
        <strong>{student?.name}</strong>
        <span className="small text-muted-strong ms-auto">{fmtDateTime(sub.submittedAt)}</span>
      </div>
      <p className="small mb-2" style={{ whiteSpace: 'pre-wrap' }}>{sub.text}</p>
      {sub.fileName && <div className="post-attach mb-2"><i className="bi bi-paperclip" aria-hidden="true" /> {sub.fileName}</div>}
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <input type="number" min={1} max={10} className="form-control" style={{ maxWidth: 90 }} value={grade}
          onChange={(e) => setGrade(e.target.value)} placeholder="Nota" aria-label="Nota" />
        <input className="form-control" style={{ maxWidth: 320 }} value={feedback} onChange={(e) => setFeedback(e.target.value)}
          placeholder="Comentario (opcional)" aria-label="Comentario privado" />
        <button type="button" className="btn btn-sm btn-primary text-white" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        {error && <span className="small" style={{ color: 'var(--bad-fg)' }}>{error}</span>}
      </div>
    </div>
  );
}

function CommentsSection({ post, isTeacher }) {
  const { db, user, addPublicComment, addPrivateComment } = useStore();
  const [tab, setTab] = useState('public');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);

  // Para el profesor, los comentarios privados se agrupan por alumno.
  const studentsInThread = isTeacher
    ? [...new Set(db.privateComments.filter((c) => c.postId === post.id).map((c) => c.studentId))]
    : [user.id];

  // Si todavía no hay un alumno elegido (por ejemplo, recién cargó la
  // materia) y ya sabemos quién escribió, seleccionamos el primero.
  useEffect(() => {
    if (activeStudent === null && studentsInThread.length > 0) setActiveStudent(studentsInThread[0]);
  }, [activeStudent, studentsInThread]);

  const effectiveStudent = isTeacher ? activeStudent : user.id;

  const privateThread = db.privateComments
    .filter((c) => c.postId === post.id && c.studentId === effectiveStudent)
    .sort((a, b) => a.at - b.at);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    setSending(true);
    try {
      if (tab === 'public') await addPublicComment(post.id, text.trim());
      else await addPrivateComment({ postId: post.id, studentId: effectiveStudent, text: text.trim() });
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="comment-tabs">
        <button type="button" className={`comment-tab ${tab === 'public' ? 'active' : ''}`} onClick={() => setTab('public')}>
          <i className="bi bi-people" aria-hidden="true" /> Comentarios públicos ({post.publicComments.length})
        </button>
        <button type="button" className={`comment-tab ${tab === 'private' ? 'active' : ''}`} onClick={() => setTab('private')}>
          <i className="bi bi-lock" aria-hidden="true" /> Privado con el profesor
        </button>
      </div>

      {tab === 'public' && (
        <div>
          {post.publicComments.map((c) => <CommentItem key={c.id} c={c} />)}
          {post.publicComments.length === 0 && <p className="small text-muted-strong">Todavía no hay comentarios.</p>}
        </div>
      )}

      {tab === 'private' && (
        <div>
          {isTeacher && studentsInThread.length > 1 && (
            <select className="form-select form-select-sm mb-2" style={{ maxWidth: 220 }}
              value={activeStudent || ''} onChange={(e) => setActiveStudent(Number(e.target.value))}>
              {studentsInThread.map((sid) => {
                const st = db.users.find((u) => u.id === sid);
                return <option key={sid} value={sid}>{st?.name}</option>;
              })}
            </select>
          )}
          {isTeacher && studentsInThread.length === 0 && (
            <p className="small text-muted-strong">Ningún alumno escribió acá todavía.</p>
          )}
          {(!isTeacher || studentsInThread.length > 0) && privateThread.map((c) => <CommentItem key={c.id} c={c} />)}
          {!isTeacher && privateThread.length === 0 && (
            <p className="small text-muted-strong">Este espacio es solo entre vos y tu profesor/a.</p>
          )}
        </div>
      )}

      {(tab === 'public' || !isTeacher || effectiveStudent) && (
        <form onSubmit={send} className="d-flex gap-2 mt-2 align-items-center">
          <input className="form-control" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={tab === 'public' ? 'Escribir un comentario público...' : 'Escribir en privado...'} />
          <button type="submit" className="btn btn-outline-secondary" disabled={sending}>
            <i className="bi bi-send" aria-hidden="true" />
          </button>
          {error && <span className="small" style={{ color: 'var(--bad-fg)' }}>{error}</span>}
        </form>
      )}
    </div>
  );
}

function CommentItem({ c }) {
  const { db } = useStore();
  const author = db.users.find((u) => u.id === c.authorId);
  return (
    <div className="comment-item">
      <Avatar name={author?.name || '?'} size={28} />
      <div className="comment-bubble">
        <div className="comment-meta"><strong>{author?.name}</strong><span>{fmtDateTime(c.at)}</span></div>
        <div>{c.text}</div>
      </div>
    </div>
  );
}
