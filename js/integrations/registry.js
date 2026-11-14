/* [LifeOS] FASE 4 - Plugin & Integration OS */
/* Todas las integraciones están desactivadas por defecto. No se conectan a servicios reales sin autorización explícita. */

export const INTEGRATIONS = Object.freeze({
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    description: 'Leer y enviar correos electrónicos',
    category: 'comunicacion',
    status: 'disconnected',
    enabled: false,
    connected: false,
    lastSync: null,
    capabilities: ['read_emails', 'send_emails', 'list_labels'],
    permissions: ['gmail.readonly', 'gmail.send'],
    errors: null,
    requiresAuth: true,
    authType: 'oauth2'
  },
  googleCalendar: {
    id: 'googleCalendar',
    name: 'Google Calendar',
    description: 'Sincronizar eventos de Google Calendar',
    category: 'calendario',
    status: 'disconnected',
    enabled: false,
    connected: false,
    lastSync: null,
    capabilities: ['read_events', 'write_events', 'list_calendars'],
    permissions: ['calendar.readonly', 'calendar.events'],
    errors: null,
    requiresAuth: true,
    authType: 'oauth2'
  },
  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Sincronizar repositorios, issues y pull requests',
    category: 'desarrollo',
    status: 'disconnected',
    enabled: false,
    connected: false,
    lastSync: null,
    capabilities: ['read_repos', 'read_issues', 'create_issues', 'read_prs'],
    permissions: ['repo', 'user:read'],
    errors: null,
    requiresAuth: true,
    authType: 'oauth2'
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    description: 'Sincronizar páginas y bases de datos',
    category: 'conocimiento',
    status: 'disconnected',
    enabled: false,
    connected: false,
    lastSync: null,
    capabilities: ['read_pages', 'write_pages', 'search'],
    permissions: ['notion.readonly', 'notion.write'],
    errors: null,
    requiresAuth: true,
    authType: 'oauth2'
  },
  serviciosFinancieros: {
    id: 'serviciosFinancieros',
    name: 'Servicios Financieros',
    description: 'Consultar saldos y movimientos (solo lectura, sin pagos)',
    category: 'finanzas',
    status: 'disconnected',
    enabled: false,
    connected: false,
    lastSync: null,
    capabilities: ['read_accounts', 'read_transactions'],
    permissions: ['finance.readonly'],
    errors: null,
    requiresAuth: true,
    authType: 'oauth2'
  },
  serviciosIA: {
    id: 'serviciosIA',
    name: 'Servicios de IA',
    description: 'Procesamiento de lenguaje natural y análisis inteligente',
    category: 'ia',
    status: 'disconnected',
    enabled: false,
    connected: false,
    lastSync: null,
    capabilities: ['text_analysis', 'sentiment_analysis', 'summarization'],
    permissions: ['ai.read', 'ai.write'],
    errors: null,
    requiresAuth: true,
    authType: 'api_key'
  },
  herramientasProductividad: {
    id: 'herramientasProductividad',
    name: 'Herramientas de Productividad',
    description: 'Integración con herramientas de gestión de tareas',
    category: 'productividad',
    status: 'disconnected',
    enabled: false,
    connected: false,
    lastSync: null,
    capabilities: ['read_tasks', 'write_tasks', 'sync_tasks'],
    permissions: ['tasks.read', 'tasks.write'],
    errors: null,
    requiresAuth: true,
    authType: 'oauth2'
  },
  apisExternas: {
    id: 'apisExternas',
    name: 'APIs Externas',
    description: 'Conectar con APIs REST externas configurables',
    category: 'sistema',
    status: 'disconnected',
    enabled: false,
    connected: false,
    lastSync: null,
    capabilities: ['rest_get', 'rest_post', 'webhook_receive'],
    permissions: ['api.read', 'api.write'],
    errors: null,
    requiresAuth: true,
    authType: 'api_key'
  }
});

export function listIntegrations() {
  return Object.values(INTEGRATIONS);
}

export function getIntegration(id) {
  return INTEGRATIONS[id] || null;
}

export async function initIntegrations() {
  // No activar automáticamente. Solo inicialización segura de stubs.
  const active = listIntegrations().filter(i => i.enabled);
  return { activeCount: active.length };
}

export async function connectIntegration(id) {
  const int = INTEGRATIONS[id];
  if (!int) throw new Error(`Integración no encontrada: ${id}`);
  if (int.connected) return int;

  // Simulación de conexión segura - no se establecen conexiones reales
  // En producción, aquí se implementaría OAuth2 o API key con almacenamiento seguro
  const connectedIntegration = {
    ...int,
    connected: true,
    status: 'connected',
    enabled: true,
    lastSync: new Date().toISOString(),
    errors: null
  };
  return connectedIntegration;
}

export async function disconnectIntegration(id) {
  const int = INTEGRATIONS[id];
  if (!int) throw new Error(`Integración no encontrada: ${id}`);

  const disconnectedIntegration = {
    ...int,
    connected: false,
    status: 'disconnected',
    enabled: false,
    lastSync: null,
    errors: null
  };
  return disconnectedIntegration;
}

export async function syncIntegration(id) {
  const int = INTEGRATIONS[id];
  if (!int) throw new Error(`Integración no encontrada: ${id}`);
  if (!int.connected) throw new Error(`Integración no conectada: ${id}`);

  // Simulación de sincronización - no se transfieren datos reales
  const syncedIntegration = {
    ...int,
    lastSync: new Date().toISOString(),
    errors: null
  };
  return syncedIntegration;
}