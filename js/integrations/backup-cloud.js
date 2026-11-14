export const cloudBackupIntegration = {
  id: 'cloudBackup',
  enabled: false,
  async upload() { throw new Error('Integración desactivada.'); },
  async restore() { throw new Error('Integración desactivada.'); }
};
