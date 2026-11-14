export const calendarIntegration = {
  id: 'calendarSync',
  enabled: false,
  async connect() { throw new Error('Integración desactivada.'); },
  async sync() { return { ok: false, reason: 'disabled' }; }
};
