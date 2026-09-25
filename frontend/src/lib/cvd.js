// Definición de los 4 tipos de daltonismo que reconoce el test, y de cómo
// cambia la interfaz para cada uno. En vez de aplicarle un filtro matemático
// a toda la pantalla (que puede verse raro sobre colores ya elegidos a mano),
// la app cambia sus propias variables de color por una paleta pensada para
// cada tipo: eso es lo que activa `data-cvd-theme` en App.jsx.

export const ALL_CVD_TYPES = ['deuteranopia', 'protanopia', 'tritanopia', 'acromatopsia'];

export const CVD_INFO = {
  deuteranopia: {
    label: 'Deuteranopía / deuteranomalía',
    short: 'Deuteranopía',
    desc: 'Falla en el verde (el tipo más común). Cuesta diferenciar marrón de naranja, y rojo de verde.',
  },
  protanopia: {
    label: 'Protanopía / protanomalía',
    short: 'Protanopía',
    desc: 'Falla en el rojo. Cuesta diferenciar rojo de negro/gris, y rojo de verde.',
  },
  tritanopia: {
    label: 'Tritanopía / tritanomalía',
    short: 'Tritanopía',
    desc: 'Falla en el azul. Cuesta diferenciar azul de verde, y amarillo de violeta.',
  },
  acromatopsia: {
    label: 'Acromatopsia',
    short: 'Acromatopsia',
    desc: 'Sin visión de color (muy poco frecuente): todo se ve en escala de grises, además de sensibilidad a la luz.',
  },
  normal: {
    label: 'Visión de color típica',
    short: 'Normal',
    desc: 'No se detectaron señales de daltonismo en esta prueba.',
  },
  inconclusivo: {
    label: 'Resultado no concluyente',
    short: 'No concluyente',
    desc: 'No pudimos confirmar el resultado. Revisá el brillo de la pantalla y repetí la prueba.',
  },
};

// Paleta de interfaz por tipo. Cada clave sobreescribe una variable CSS
// (ver :root y los bloques [data-cvd-theme="…"] en styles.css).
// La idea en cada caso es dejar de usar el par de colores que ese tipo
// confunde y apoyarse en el que sí distingue con claridad, más íconos.
export const CVD_THEME = {
  deuteranopia: {
    // Confunde rojo/verde y marrón/naranja → el verde deja de ser "éxito"
    // y todo el acento pasa a azul + ámbar, que sí distingue bien.
    '--moss': '#0d5f8a',
    '--moss-dark': '#0a4a6b',
    '--clay': '#a15b00',
    '--sun': '#d69a00',
    '--sky': '#0d5f8a',
    '--ok-bg': '#dcebf5', '--ok-fg': '#0a4a6b',
    '--warn-bg': '#f7e6c4', '--warn-fg': '#7a5410',
    '--bad-bg': '#f3ddc2', '--bad-fg': '#7a4400',
    '--info-bg': '#dcebf5', '--info-fg': '#0a4a6b',
  },
  protanopia: {
    // El rojo se ve muy oscuro/negro para este tipo: se reemplaza por
    // azul + ámbar bien saturado, evitando rojos oscuros como advertencia.
    '--moss': '#0d5f8a',
    '--moss-dark': '#0a4a6b',
    '--clay': '#b3790a',
    '--sun': '#e0ab00',
    '--sky': '#0d5f8a',
    '--ok-bg': '#dcebf5', '--ok-fg': '#0a4a6b',
    '--warn-bg': '#f7e6c4', '--warn-fg': '#7a5410',
    '--bad-bg': '#f4e4bd', '--bad-fg': '#8a5a00',
    '--info-bg': '#dcebf5', '--info-fg': '#0a4a6b',
  },
  tritanopia: {
    // Confunde azul/verde y amarillo/violeta → el acento se aleja del
    // azul y del amarillo, y pasa a un rosado/rojo bien distinguible.
    '--moss': '#b6295f',
    '--moss-dark': '#8c1f49',
    '--clay': '#b6295f',
    '--sun': '#495057',
    '--sky': '#2f9e64',
    '--ok-bg': '#dcf1e4', '--ok-fg': '#1d6b40',
    '--warn-bg': '#e7e4e0', '--warn-fg': '#495057',
    '--bad-bg': '#f6dbe5', '--bad-fg': '#8c1f49',
    '--info-bg': '#f6dbe5', '--info-fg': '#8c1f49',
  },
  acromatopsia: {
    // Sin percepción de color: todo pasa a una escala de grises con
    // buen contraste de claridad, y el fondo se oscurece un poco para
    // no encandilar (suele venir con fotosensibilidad).
    '--paper': '#e6e4df',
    '--paper-raised': '#f5f4f1',
    '--ink': '#161616',
    '--line': '#b9b7b1',
    '--muted': '#5a5a5a',
    '--moss': '#2b2b2b',
    '--moss-dark': '#111111',
    '--clay': '#3a3a3a',
    '--sun': '#4d4d4d',
    '--sky': '#2b2b2b',
    '--ok-bg': '#d9d9d6', '--ok-fg': '#161616',
    '--warn-bg': '#c9c8c4', '--warn-fg': '#161616',
    '--bad-bg': '#b3b2ae', '--bad-fg': '#111111',
    '--info-bg': '#d9d9d6', '--info-fg': '#161616',
  },
};
