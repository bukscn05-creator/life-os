# DECISIONS — LIFE OS

## 2026-11-14
1. **Directorio de proyecto:** `/home/bukscn05/life-os` creado como nuevo workspace al no encontrarse un repo LIFE OS local/remotamente accesible desde el entorno auditado. *Revisar si existe repo remoto oficial antes de publicar/mezclar historiales.*
2. **Git local:** inicializado en `master` (por defecto de git en entorno); configurar/renombrar rama de trabajo según convenga al conectar con remoto existente.
3. **FASE 0/1 juntas:** se implementó esqueleto completo + maqueta de los 12 módulos en una sola entrega.
4. **FASE 2 (persistencia):** `js/db.js` migrado a IndexedDB real (`lifeos` v1, 14 stores, índices, seed solo si vacío). Módulos refactorizados a CRUD persistente vía `ctx.save/ctx.del`.
5. **Backup/restore:** exportación/importación JSON desde **Hoy** con validación de estructura y confirmación explícita antes de sobrescribir.
6. **Iconos:** SVG locales en `assets/` para evitar dependencias externas/binarios generados.
7. **FASE 3:** integraciones preparadas en `js/integrations/` con registry/stubs y todas desactivadas por defecto.
8. **FASE 4:** pulido práctico (confirmaciones de eliminación, SW `lifeos-v1.0.0`, estado local/offline, mensajes de error) sin introducir dependencias ni backend.
9. **FASE 5:** entrega local completada con verificación estática (`node --check`) y documentación; pruebas runtime/Lighthouse quedan **NOT TESTED** por falta de ejecución en navegador en este entorno.
10. **Acceso GitHub/Vercel/publicación:** no disponibles/autorizados en esta sesión; sin push a remoto verificado y sin deploy a producción.
