# PUBLICAR — LIFE OS

> **Estado:** **NO LISTA PARA PUBLICAR.** La puerta de publicación (sección 11 de `docs/ENCARGO.md`) **no se cumple**. No publicar sin cumplir requisitos y sin tu aprobación.

## Requisitos previos
- [ ] `npm run verify` en verde **dos veces consecutivas**, sin cambios entre ellas (gates completos de sección 11).
- [ ] Todas las casillas de la sección 11 cumplidas con evidencia (13 secciones conformes, F1–F21 con test/captura, 15 temas/contraste, migración v4 probada y backup restaurable, offline/instalable verificado, cero peticiones externas, documentación y versión 1.0.0 coherentes).
- [ ] Lo no verificable declarado como **NO VERIFICADO** resuelto o aceptado explícitamente por ti.
- [ ] Revisión y **aprobación tuya**.

## Pasos (cuando proceda y tras aprobación)
1. **Revisión final:** rama `work/life-os-v1`, versión `1.0.0` coherente (package, Ajustes→Diagnóstico, CHANGELOG), documentos actualizados.
2. **Merge:** integrar en rama principal **solo tras tu aprobación** (no realizado por el agente).
3. **Despliegue:** publicar estático en el hosting elegido. Asegurar `vercel.json`/headers (incl. CSP según implementación final), `sw.js` con `Cache-Control: no-cache`, y activos con estrategia de caché adecuada.
4. **Comprobaciones post-despliegue:** carga, rutas hash, offline, instalación PWA, ausencia de peticiones a otros orígenes, export/import y migración según lo implementado.
5. **Instalar en Chromebook:** Chrome → “Instalar app” cuando esté disponible.
6. **Instalar en iPhone 14:** Safari → Compartir → “Añadir a pantalla de inicio”; abrir desde icono. Datos de app instalada independientes del navegador.
7. **Volver atrás:** conservar commit/tag previo y revertir despliegue en hosting; recomendar exportar copia antes de cambios mayores.

## Notas
- Sin sincronización automática entre dispositivos: usar Exportar/Importar (reemplazar/combinar) cuando esté implementado y verificado.
- No se generan vistas previas intermedias por el agente. Vista local: `python3 -m http.server 8080 --bind 127.0.0.1` → `http://127.0.0.1:8080/`.