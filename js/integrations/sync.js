export const deviceSyncIntegration = {
  id: 'deviceSync',
  enabled: false,
  async sync() { throw new Error('Integración desactivada. No disponible en v1.'); }
};
