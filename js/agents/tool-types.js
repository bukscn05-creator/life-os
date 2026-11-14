// TOOL TYPES — LIFE OS AGENTIC OS
// Tipos y registro de herramientas para agentes

export class ToolDefinition {
  constructor({
    name,
    displayName,
    description,
    version = '1.0.0',
    category = 'general',
    parameters = [],
    returns,
    examples = [],
    authRequired = false,
    rateLimit = null,
    cost = 0,
    metadata = {}
  }) {
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.version = version;
    this.category = category;
    this.parameters = parameters;
    this.returns = returns;
    this.examples = examples;
    this.authRequired = authRequired;
    this.rateLimit = rateLimit;
    this.cost = cost;
    this.metadata = metadata;
    this.createdAt = new Date().toISOString();
    this.usageCount = 0;
    this.lastUsed = null;
  }

  validate(input) {
    for (const param of this.parameters) {
      if (param.required && !(param.name in input)) {
        throw new Error(`Parámetro requerido faltante: ${param.name}`);
      }
      if (param.name in input) {
        const value = input[param.name];
        if (param.type && !this.validateType(value, param.type)) {
          throw new Error(`Tipo inválido para parámetro ${param.name}: se esperaba ${param.type}`);
        }
      }
    }
    return true;
  }

  validateType(value, type) {
    const typeMap = {
      string: typeof value === 'string',
      number: typeof value === 'number' && !isNaN(value),
      boolean: typeof value === 'boolean',
      array: Array.isArray(value),
      object: typeof value === 'object' && value !== null,
      date: value instanceof Date || (/^\d{4}-\d{2}-\d{2}/.test(value)),
      email: typeof value === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
    };
    return typeMap[type] || false;
  }
}

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.agentTools = new Map();
  }

  register(definition) {
    this.tools.set(definition.name, definition);
  }

  get(name) {
    return this.tools.get(name) || null;
  }

  find(predicate) {
    return Array.from(this.tools.values()).filter(predicate);
  }

  assignToolToAgent(agentId, toolName) {
    if (!this.agentTools.has(agentId)) {
      this.agentTools.set(agentId, new Set());
    }
    this.agentTools.get(agentId).add(toolName);
  }

  async validateToolUsage(agentId, toolName) {
    const agentTools = this.agentTools.get(agentId);
    if (!agentTools || !agentTools.has(toolName)) {
      return false;
    }
    const tool = this.tools.get(toolName);
    if (!tool) return false;
    return true;
  }

  getToolsForAgent(agentId) {
    const toolNames = this.agentTools.get(agentId) || new Set();
    return Array.from(toolNames).map(name => this.tools.get(name)).filter(Boolean);
  }

  getAll() {
    return Array.from(this.tools.values());
  }

  count() {
    return this.tools.size;
  }
}