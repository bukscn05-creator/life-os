// AGENT TYPES — LIFE OS AGENTIC OS
// Tipos de datos para el sistema de agentes

export const AGENT_TYPES = {
  FINANCE: 'finance_agent',
  PRODUCTIVITY: 'productivity_agent',
  CALENDAR: 'calendar_agent',
  RESEARCH: 'research_agent',
  PROJECTS: 'projects_agent',
  KNOWLEDGE: 'knowledge_agent',
  AUTOMATION: 'automation_agent',
  PERSONAL_ASSISTANT: 'personal_assistant'
};

export const AGENT_STATUSES = {
  IDLE: 'idle',
  RUNNING: 'running',
  WAITING: 'waiting',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused'
};

export class AgentDescriptor {
  constructor({
    id,
    type,
    name,
    description,
    version = '1.0.0',
    capabilities = [],
    tools = [],
    skills = [],
    permissions = { read: [], write: [], external: [] },
    configuration = {},
    status = AGENT_STATUSES.IDLE,
    metadata = {}
  }) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = description;
    this.version = version;
    this.capabilities = capabilities;
    this.tools = tools;
    this.skills = skills;
    this.permissions = permissions;
    this.configuration = configuration;
    this.status = status;
    this.metadata = metadata;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.executionCount = 0;
    this.errorCount = 0;
    this.lastExecution = null;
    this.nextExecution = null;
  }
}

export class Agent {
  constructor(descriptor) {
    this.descriptor = descriptor;
    this.id = descriptor.id;
    this.type = descriptor.type;
    this.name = descriptor.name;
    this.description = descriptor.description;
    this.capabilities = descriptor.capabilities;
    this.tools = descriptor.tools;
    this.skills = descriptor.skills;
    this.permissions = descriptor.permissions;
    this.configuration = descriptor.configuration;
    this.status = descriptor.status;
    this.metadata = descriptor.metadata;
    this.createdAt = descriptor.createdAt;
    this.updatedAt = descriptor.updatedAt;
    this.executionCount = descriptor.executionCount;
    this.errorCount = descriptor.errorCount;
    this.lastExecution = descriptor.lastExecution;
    this.nextExecution = descriptor.nextExecution;
  }

  update(fields) {
    Object.assign(this, fields);
    this.descriptor.updatedAt = new Date().toISOString();
  }

  async performAction(task, context) {
    // Implementación base - debe ser sobrescrita por agentes especializados
    return {
      agentId: this.id,
      taskType: task.type,
      result: 'Acción base ejecutada',
      timestamp: new Date().toISOString()
    };
  }
}

export class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.typeIndex = new Map();
    this.toolIndex = new Map();
    this.skillIndex = new Map();
  }

  register(descriptor) {
    const agent = new Agent(descriptor);
    this.agents.set(agent.id, agent);

    if (!this.typeIndex.has(agent.type)) {
      this.typeIndex.set(agent.type, new Set());
    }
    this.typeIndex.get(agent.type).add(agent.id);

    agent.tools.forEach(tool => {
      if (!this.toolIndex.has(tool)) {
        this.toolIndex.set(tool, new Set());
      }
      this.toolIndex.get(tool).add(agent.id);
    });

    agent.skills.forEach(skill => {
      if (!this.skillIndex.has(skill)) {
        this.skillIndex.set(skill, new Set());
      }
      this.skillIndex.get(skill).add(agent.id);
    });

    return agent.id;
  }

  get(id) {
    return this.agents.get(id) || null;
  }

  find(predicate) {
    return Array.from(this.agents.values()).filter(predicate);
  }

  findByType(type) {
    const ids = this.typeIndex.get(type) || [];
    return Array.from(ids).map(id => this.agents.get(id)).filter(Boolean);
  }

  findByTool(toolName) {
    const ids = this.toolIndex.get(toolName) || [];
    return Array.from(ids).map(id => this.agents.get(id)).filter(Boolean);
  }

  findBySkill(skillName) {
    const ids = this.skillIndex.get(skillName) || [];
    return Array.from(ids).map(id => this.agents.get(id)).filter(Boolean);
  }

  update(agentId, updates) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agente no encontrado: ${agentId}`);
    agent.update(updates);
    return agent;
  }

  remove(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    if (this.typeIndex.has(agent.type)) {
      this.typeIndex.get(agent.type).delete(agent.id);
    }
    agent.tools.forEach(tool => {
      if (this.toolIndex.has(tool)) {
        this.toolIndex.get(tool).delete(agent.id);
      }
    });
    agent.skills.forEach(skill => {
      if (this.skillIndex.has(skill)) {
        this.skillIndex.get(skill).delete(agent.id);
      }
    });

    return this.agents.delete(agentId);
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  count() {
    return this.agents.size;
  }
}