import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { PLATES, evaluate, precheck, CONFIRM_QUESTIONS } from '../lib/plates.js';
import { CVD_INFO } from '../lib/cvd.js';
import PlateCanvas from '../components/PlateCanvas.jsx';

const RESULT_COLOR = {
  deuteranopia: '#0d5f8a',
  protanopia: '#b3790a',
  tritanopia: '#b6295f',
  acromatopsia: '#2b2b2b',
  normal: '#2f6f5e',
  inconclusivo: '#6b6459',
};

const RESULT_ICON = {
  deuteranopia: 'bi-palette',
  protanopia: 'bi-palette',
  tritanopia: 'bi-palette',
  acromatopsia: 'bi-brightness-low',
  normal: 'bi-check-lg',
  inconclusivo: 'bi-question-lg',
};

export default function TestDaltonismo() {
  const { updateUser } = useStore();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState('plates'); // 'plates' | 'confirm' | 'result'
  const [confirm, setConfirm] = useState({});
  const [result, setResult] = useState(null);

  const plate = PLATES[i];
  const totalSteps = PLATES.length + 1;
  const progress = Math.round(((phase === 'plates' ? i : PLATES.length + (phase === 'confirm' ? 0.5 : 1)) / totalSteps) * 100);

  const choosePlate = (tag) => {
    const next = { ...answers, [plate.id]: tag };
    setAnswers(next);
    if (i + 1 < PLATES.length) {
      setI(i + 1);
      return;
    }
    const pre = precheck(next);
    if (pre.suspectAcromatopsia) {
      setPhase('confirm');
    } else {
      setResult(evaluate(next, null));
      setPhase('result');
    }
  };

  const answerConfirm = (id, value) => {
    const next = { ...confirm, [id]: value };
    setConfirm(next);
    if (next.grayscale !== undefined && next.light !== undefined) {
      setResult(evaluate(answers, next));
      setPhase('result');
    }
  };

  const info = result ? CVD_INFO[result.type] : null;

  const finish = async (applyTheme) => {
    await updateUser({ cvdType: result.type, testDone: true, prefs: { filterOn: applyTheme } });
    nav('/inicio', { replace: true });
  };

  const retry = () => {
    setI(0); setAnswers({}); setConfirm({}); setResult(null); setPhase('plates');
  };

  return (
    <div className="test-shell">
      <div className="d-flex align-items-center gap-2 mb-3 text-muted-strong">
        <i className="bi bi-eye" aria-hidden="true" />
        <span>Test de percepción del color</span>
      </div>

      {(phase === 'plates' || phase === 'confirm') && (
        <div className="test-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${progress}%` }} />
        </div>
      )}

      {phase === 'plates' && (
        <>
          <p className="text-muted-strong mb-3">Lámina {i + 1} de {PLATES.length}</p>

          <div className="plate-wrap">
            <PlateCanvas plate={plate} />
            <h2 className="h6 mt-3 mb-0">¿Qué número ves en el círculo?</h2>
          </div>

          <div className="plate-options">
            {plate.options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className={`plate-option ${opt.tag === 'none' ? 'none-option' : ''}`}
                onClick={() => choosePlate(opt.tag)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'confirm' && (
        <div className="plate-wrap text-start">
          <p className="text-muted-strong mb-3">
            Dos preguntas más para confirmar el resultado.
          </p>
          {CONFIRM_QUESTIONS.map((q) => (
            <div key={q.id} className="confirm-q">
              <p>{q.text}</p>
              <div className="btn-group-yn">
                <button
                  type="button"
                  className={`btn ${confirm[q.id] === true ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                  onClick={() => answerConfirm(q.id, true)}
                >
                  Sí
                </button>
                <button
                  type="button"
                  className={`btn ${confirm[q.id] === false ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                  onClick={() => answerConfirm(q.id, false)}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'result' && (
        <div className="plate-wrap text-center">
          <div className="result-badge" style={{ background: RESULT_COLOR[result.type] }}>
            <i className={`bi ${RESULT_ICON[result.type]}`} aria-hidden="true" />
          </div>
          <h1 className="h4 mb-1">{info.label}</h1>
          <p className="text-muted-strong mb-1">{info.desc}</p>
          {result.confidence && result.type !== 'inconclusivo' && (
            <p className="small text-muted-strong">
              Confianza del resultado: <strong>{result.confidence}</strong> · {result.normalCount} de {PLATES.length} láminas leídas como esperado
            </p>
          )}

          {result.type === 'inconclusivo' ? (
            <button className="btn btn-primary text-white mt-3" onClick={retry}>Repetir el test</button>
          ) : result.type === 'normal' ? (
            <button className="btn btn-primary text-white mt-3" onClick={() => finish(false)}>Continuar a Aula Inclusiva</button>
          ) : (
            <>
              <p className="mt-3 mb-2">
                {result.type === 'acromatopsia'
                  ? 'Podemos adaptar la interfaz a escala de grises con buen contraste, y bajar un poco el brillo para que no te encandile.'
                  : 'Podemos cambiar los colores de toda la interfaz por una paleta pensada para tu tipo de daltonismo.'}
              </p>
              <div className="d-flex flex-column gap-2 align-items-stretch">
                <button className="btn btn-primary text-white" onClick={() => finish(true)}>
                  <i className="bi bi-magic" aria-hidden="true" /> Adaptar la interfaz y continuar
                </button>
                <button className="btn btn-outline-secondary" onClick={() => finish(false)}>
                  Continuar con los colores originales (puedo activarlo después)
                </button>
              </div>
            </>
          )}

          <button type="button" className="btn btn-sm btn-link mt-3" onClick={retry}>
            Repetir el test de nuevo
          </button>

          <p className="small text-muted-strong mt-3 mb-0">
            Esta prueba se basa en el principio de las láminas pseudoisocromáticas de Ishihara y es orientativa, no un diagnóstico médico.
          </p>
        </div>
      )}
    </div>
  );
}
