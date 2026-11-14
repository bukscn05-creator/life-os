const pr = new Intl.PluralRules('es-ES');
export function pluralize(n, one, other) {
  const cat = pr.select(Math.abs(Number(n) || 0));
  return cat === 'one' ? one : other;
}
export function countLabel(n, one, other) {
  return `${n} ${pluralize(n, one, other)}`;
}
