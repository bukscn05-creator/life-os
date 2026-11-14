// SKILL TYPES — LIFE OS AGENTIC OS
// Tipos y registro de skills para agentes

export class SkillDefinition {
  constructor({
    name,
    displayName,
    description,
    version = '1.0.0',
    category = 'general',
    parameters = [],
    returns,
    examples = [],
    requiredTools = [],
    complexity = 'simple',
    estimatedTime = 0,
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
    this.requiredTools = requiredTools;
    this.complexity = complexity;
    this.estimatedTime = estimatedTime;
    this.metadata = metadata;
    this.createdAt = new Date().toISOString();
  }
}

export class SkillRegistry {
  constructor() {
    this.skills = new Map();
    this.agentSkills = new Map();
  }

  register(definition) {
    this.skills.set(definition.name, definition);
  }

  get(name) {
    return this.skills.get(name) || null;
  }

  find(predicate) {
    return Array.from(this.skills.values()).filter(predicate);
  }

  assignSkillToAgent(agentId, skillName) {
    if (!this.agentSkills.has(agentId)) {
      this.agentSkills.set(agentId, new Set());
    }
    this.agentSkills.get(agentId).add(skillName);
  }

  async validateSkillUsage(agentId, skillName) {
    const agentSkills = this.agentSkills.get(agentId);
    if (!agentSkills || !agentSkills.has(skillName)) {
      return false;
    }
    return true;
  }

  getSkillsForAgent(agentId) {
    const skillNames = this.agentSkills.get(agentId) || new Set();
    return Array.from(skillNames).map(name => this.skills.get(name)).filter(Boolean);
  }

  getAll() {
    return Array.from(this.skills.values());
  }

  count() {
    return this.skills.size;
  }
}