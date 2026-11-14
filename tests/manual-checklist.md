# Manual Checklist — LIFE OS

## FASE 0 — Taller
- [x] Estructura, HTML, CSS, manifest, SW, README y guardrails — **PASS** (código/docs)

## FASE 1 — Maqueta
- [x] 12 módulos con UI, navegación y datos de ejemplo — **PASS**
- [x] Estados vacíos y acciones de UI — **PASS**

## FASE 2 — Funcionalidad
- [x] IndexedDB `lifeos` + 14 stores, índices y migración base — **PASS** (código)
- [x] CRUD persistente y recarga de estado — **PASS** (código)
- [x] Exportación/importación JSON con validación y confirmación — **PASS** (código/UI)
- [ ] Persistencia/CRUD/export-import en navegador real — **NOT TESTED**
- [ ] Casos límite runtime (backup inválido, almacenamiento, etc.) — **NOT TESTED**

## FASE 3 — Integraciones
- [x] Estructura `js/integrations/` preparada con flags desactivados y sin activación automática — **PASS**

## FASE 4 — Pulido
- [x] Manejo de errores básico, logs `[LifeOS]`, estados vacíos, confirmaciones de borrado — **PASS** (código)
- [x] Responsive base (320/640/1280), safe areas, `prefers-reduced-motion`, inputs 16px/tap targets — **PASS** (código)
- [ ] Verificación visual iPhone 14 (390x844) y Chromebook (1280x800) — **NOT TESTED**
- [ ] Accesibilidad auditada en navegador/lector — **NOT TESTED**
- [ ] Rendimiento percibido y Lighthouse — **NOT TESTED**

## FASE 5 — Verificación y lanzamiento
- [x] `node --check` en JS/SW — **PASS**
- [x] Documentación operativa actualizada — **PASS**
- [ ] Pruebas runtime completas, preview Vercel, despliegue producción — **NOT TESTED / NO AUTORIZADO / SIN ACCESO** (GitHub/Vercel)

> Nota: no se declaran PASS sin pruebas runtime donde aplica. Entorno sin ejecución de navegador automatizada/dispositivo para esta verificación.
