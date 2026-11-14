# Contribuir — LIFE OS

## Requisitos
- Node.js ≥ 20, npm. Navegador moderno. Python 3 para servidor estático local.

## Ejecución local
```bash
python3 -m http.server 8080 --bind 127.0.0.1
# abrir http://127.0.0.1:8080/
```

## Rama y commits
- Trabajar en rama `work/*` (nunca `main`). Commits por tema.
- Respetar `docs/ENCARGO.md`: 0 € runtime, cero peticiones externas, privacidad local, datos sagrados, sin entregables prohibidos (marcadores pendientes, texto de relleno, sentencias de depuración, `console.*`, etc.).

## Verificación
```bash
npm run verify
```
- Ejecuta comprobaciones básicas (lint/sintaxis/guardarraíles, contraste 15 combinaciones, tests unitarios). **No equivale** a la puerta completa de publicación (sección 11): faltan E2E/axe/Lighthouse/instalabilidad CDP, pruebas de red/mono/visual, presupuesto/cobertura formal y otras exigidas. El script sale con código distinto de 0 mientras la puerta no esté satisfecha.

## Estructura
- `js/core/`: fechas, dinero, pluralización, ids, recurrencias, presupuesto, hábitos, storage (bases).
- `js/modules/`: vistas/módulos (render/bind) y `ajustes`.
- `js/ui/`: componentes, render, hojas/toasts.
- `css/`: tokens, base, layout, componentes. `scripts/`: contraste, lint, verify. `tests/unit/`: tests node.

## Cómo añadir
- **Módulo:** implementar `render*/bind*` en `js/modules/`, registrar ruta y metadatos en `js/app.js`, añadir a navegación/shell y precache en `sw.js`; seguir patrones de filas/hojas, validación, accesibilidad y persistencia.
- **Migración:** versionar esquema, paso encadenado e idempotente, backup previo, fixtures (incl. v4/corruptos) y tests.
- **Test:** unitarios en `tests/unit` (`node --test`); E2E/axe según especificación cuando el entorno esté disponible.

## Hooks/CI
- `.githooks` y `.github/workflows/verify.yml` previstos por el encargo; configuración completa y operativa **pendiente/no verificada**.