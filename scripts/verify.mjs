import { spawnSync } from 'child_process';

function run(name, cmd, args) {
  process.stdout.write(`\n== ${name} ==\n`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  return r.status === 0;
}

let ok = true;
ok = run('Lint básico / guardarraíles / sintaxis', process.execPath, ['scripts/lint-basic.mjs']) && ok;
ok = run('Contraste (15 combinaciones)', process.execPath, ['scripts/contrast.mjs']) && ok;
ok = run('Tests unitarios (node --test)', process.execPath, ['--test', 'tests/unit/dates.mjs','tests/unit/money.mjs','tests/unit/plural.mjs','tests/unit/recurrence.mjs','tests/unit/agent-registry.mjs','tests/unit/agent-tool-skill.mjs','tests/unit/agent-execution.mjs']) && ok;

console.log('\n== Verificaciones NO ejecutadas en este entorno ==');
console.log('- ESLint completo + formato (no configurado completamente)');
console.log('- E2E Playwright Chromium/WebKit, axe-core, rastreador de controles, prueba de red automatizada, monkey, regresión visual');
console.log('- Lighthouse ≥95 e instalabilidad por CDP');
console.log('- Presupuesto de peso automatizado');
console.log('- Cobertura ≥90% medida formalmente en pipeline completo');

if (!ok) {
  console.error('\nVERIFY: FALLÓ (no apto para puerta de publicación)');
  process.exit(1);
}
console.log('\nVERIFY: comprobaciones básicas pasaron, pero la puerta de publicación (sección 11) NO está satisfecha por verificaciones faltantes/NO VERIFICADO.');
// Exit non-zero because full gate is not satisfied per spec? Spec says "sale con código != 0 si algo falla" and requires all gates; missing gates mean cannot claim green.
// But to be useful we exit 1 to reflect not fully green.
process.exit(1);
