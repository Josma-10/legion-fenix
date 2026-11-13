export const DISCIPLINES = [
  {
    key: 'Campo',
    label: 'Equipo de Fútbol Campo',
    short: 'Fútbol Campo',
    quadrant: 'Cuadrante Norte - Campo',
    description: 'Cancha reglamentaria 11v11 • Todas las categorías desde Bebés hasta Libre.',
  },
  {
    key: 'F7',
    label: 'Equipo de Fútbol 7',
    short: 'Fútbol 7',
    quadrant: 'Cuadrante Sur - F7',
    description: 'Formato formativo y competitivo 7v7 • Todas las categorías desde Bebés hasta Libre.',
  },
  {
    key: 'Sala',
    label: 'Equipo de Sala',
    short: 'Fútbol Sala',
    quadrant: 'Cancha Techada - Sala',
    description: 'Domo techado 40x20 Futsal 5v5 • Todas las categorías desde Bebés hasta Libre.',
  },
];

export const AGE_CATEGORY_ORDER = [
  'Bebés (Sub-6)',
  'Sub-8',
  'Sub-10',
  'Sub-12',
  'Sub-14',
  'Sub-16',
  'Sub-18',
  'Sub-20',
  'Libre',
];

export function calculateAgeFromBirthDate(birthDateStr) {
  if (!birthDateStr || typeof birthDateStr !== 'string') return null;
  const parts = birthDateStr.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  const mDiff = today.getMonth() + 1 - month;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function recommendCategoryNameForAge(age, isAdultSelfReg = false) {
  if (age === null || age === undefined) return null;
  if (isAdultSelfReg) {
    if (age < 18) return null;
    return age >= 21 ? 'Libre' : 'Sub-20';
  }
  if (age <= 6) return 'Bebés (Sub-6)';
  if (age <= 8) return 'Sub-8';
  if (age <= 10) return 'Sub-10';
  if (age <= 12) return 'Sub-12';
  if (age <= 14) return 'Sub-14';
  if (age <= 16) return 'Sub-16';
  if (age === 17) return 'Sub-18';
  if (age <= 20) return 'Sub-20';
  return 'Libre';
}

export function groupCategoriesByDiscipline(categories = []) {
  return DISCIPLINES.map((disc) => {
    const items = categories
      .filter((c) => c.modalidad === disc.key)
      .sort(
        (a, b) =>
          AGE_CATEGORY_ORDER.indexOf(a.nombre) - AGE_CATEGORY_ORDER.indexOf(b.nombre)
      );
    return {
      ...disc,
      items,
    };
  });
}
