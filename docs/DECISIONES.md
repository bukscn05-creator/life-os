# Decisiones (LIFE OS v1)

Formato: **Decisión** · Alternativas consideradas · Motivo · Fecha/Contexto.

## Paso 0 / Rama y alcance
- **Decisión:** Trabajar en `work/life-os-v1` (nunca `main`). Mantener stack HTML/CSS/JS estático (ES modules, hash routing, IndexedDB, PWA) y evolucionarlo.
- **Alternativas:** framework/build completo.
- **Motivo:** Conserva base local-first y datos; menor riesgo que migración total; compatible con requisitos de 0 € y control del código.

## Entorno y verificación
- **Decisión:** Declarar **NO VERIFICADO** lo que no tenga evidencia ejecutada en este entorno (WebKit/iPhone real/Chromebook físico, Lighthouse/CDP instalabilidad, E2E/axe/mono/visual completos, cobertura formal ≥90% en pipeline exigido).
- **Motivo:** Regla del encargo: evidencia obligatoria, prohibido presentar como hecho.

## Diseño y UI
- **Decisión:** Implementar dirección Calma de forma progresiva: `css/tokens.css` (modos/acentos), `js/theme-init.js` pre-paint, rediseño de shell (sidebar colapsable, móvil 5+Más, FAB), componentes base (hojas, filas, toasts, estados vacíos) y reescritura de módulos sin héroes/métricas de relleno/botones redundantes.
- **Alternativas:** mantener estética v4; reescritura visual total pixel-perfect en una pasada.
- **Motivo:** Avance sustancial hacia requisitos prioritarios manteniendo coherencia funcional; contraste base validado (`scripts/contrast.mjs`).

## Datos, lógica y compatibilidad
- **Decisión:** No sembrar datos de ejemplo automáticamente en primera apertura; conservar datos existentes. Añadir módulos núcleo (`core/dates,money,plural,recurrence,budget,habits,ids,storage` base) y mejorar utilidades sin forzar migración destructiva de esquema.
- **Alternativas:** reset/migración agresiva inmediata.
- **Motivo:** “Mis datos son sagrados”; evitar pérdida. Migración completa con fixture real/backup/restauración queda pendiente y debe hacerse con pruebas antes de activar.

## Calidad y entrega
- **Decisión:** Añadir `scripts/lint-basic.mjs`, `scripts/verify.mjs`, unit tests (`tests/unit/*.mjs`) y ejecutar comprobaciones factibles (sintaxis/guardarraíles básicos, contraste, tests). Mantener `npm run verify` como no satisfactorio de la puerta completa mientras falten gates exigidos.
- **Alternativas:** omitir tooling; declarar verde sin evidencia.
- **Motivo:** Mejora robustez futura y aporta evidencia parcial sin incumplir la regla de honestidad.

## PWA y despliegue
- **Decisión:** Actualizar `manifest.json`, `sw.js` (cache versionada, precache ampliado) y añadir `vercel.json` con cabeceras básicas/`sw.js` no-cache.
- **Motivo:** Alineación con requisitos de actualización, privacidad y despliegue; verificación completa de instalabilidad/offline/CSP estricta sigue pendiente.