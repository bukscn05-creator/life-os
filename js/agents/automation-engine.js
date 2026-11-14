// AUTOMATION ENGINE — LIFE OS AGENTIC OS
// Motor de automatizaciones con triggers, condiciones y acciones

export class AutomationSpec {
  constructor({
    id,
    name,
    description,
    trigger,
    conditions = [],
    actions = [],
    dependencies = [],
    schedule = null,
    enabled = true,
    maxRetries = 3,
    timeoutMs = 30000,
    metadata = {}
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.trigger = trigger;
    this.conditions = conditions;
    this.actions = actions;
    this.dependencies = dependencies;
    this.schedule = schedule;
    this.enabled = enabled;
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
    this.metadata = metadata;
    this.createdAt = new Date().toISOString();
    this.lastExecution = null;
    this.executionCount = 0;
    this.errorCount = 0;
  }
}

export class AutomationExecution {
  constructor({
    id,
    automationId,
    status,
    input,
    output,
    error,
    startTime,
    endTime,
    durationMs
  }) {
    this.id = id;
    this.automationId = automationId;
    this.status = status;
    this.input = input;
    this.output = output;
    this.error = error;
    this.startTime = startTime;
    this.endTime = endTime;
    this.durationMs = durationMs;
  }
}

export class AutomationEngine {
  constructor(coordinator, executionEngine) {
    this.coordinator = coordinator;
    this.executionEngine = executionEngine;
    this.automations = new Map();
    this.schedules = new Map();
    this.executions = new Map();
  }

  async createAutomation(spec) {
    const validation = await this.validateAutomation(spec);
    if (!validation.valid) {
      throw new Error(`Automatización inválida: ${validation.errors.join(', ')}`);
    }

    const automationId = spec.id || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const automation = new AutomationSpec({ ...spec, id: automationId, enabled: true });
    this.automations.set(automationId, automation);

    if (automation.schedule) {
      await this.scheduleAutomation(automationId, automation.schedule);
    }

    return automationId;
  }

  async executeAutomation(automationId, context) {
    const automation = this.automations.get(automationId);
    if (!automation || !automation.enabled) {
      throw new Error(`Automatización no encontrada o deshabilitada: ${automationId}`);
    }

    for (const condition of automation.conditions) {
      const result = await this.evaluateCondition(condition, context);
      if (!result) {
        return { status: 'skipped', reason: 'condición no satisfecha' };
      }
    }

    const executionId = await this.executionEngine.submitTask(
      { type: 'automation', automationId, automation },
      context
    );

    automation.executionCount++;
    automation.lastExecution = new Date().toISOString();

    return { automationId, executionId, status: 'started' };
  }

  async scheduleAutomation(automationId, schedule) {
    this.schedules.set(automationId, schedule);
  }

  async validateAutomation(spec) {
    const errors = [];

    if (!spec.id || typeof spec.id !== 'string') {
      errors.push('ID de automatización requerido');
    }
    if (!spec.name || typeof spec.name !== 'string') {
      errors.push('Nombre de automatización requerido');
    }
    if (!spec.trigger) {
      errors.push('Disparador requerido');
    }
    if (!spec.actions || spec.actions.length === 0) {
      errors.push('Al menos una acción requerida');
    }

    if (spec.conditions) {
      for (let i = 0; i < spec.conditions.length; i++) {
        const condition = spec.conditions[i];
        if (!condition || typeof condition !== 'object') {
          errors.push(`Condición ${i} inválida`);
        }
      }
    }

    if (spec.actions) {
      for (let i = 0; i < spec.actions.length; i++) {
        const action = spec.actions[i];
        if (!action || typeof action !== 'object') {
          errors.push(`Acción ${i} inválida`);
        }
        if (!action.type || typeof action.type !== 'string') {
          errors.push(`Acción ${i} sin tipo`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async evaluateCondition(condition, context) {
    switch (condition.type) {
      case 'daily': {
        const today = new Date().toISOString().split('T')[0];
        const [hour, minute] = condition.time.split(':');
        const now = new Date();
        return today === context.date &&
               now.getHours() === parseInt(hour) &&
               now.getMinutes() === parseInt(minute);
      }
      case 'on_weekday':
        const day = new Date().getDay();
        return condition.weekdays.includes(day);
      case 'if_amount':
        return context.finance && context.finance[condition.resource] > condition.threshold;
      default:
        return false;
    }
  }

  async getAutomationStatus(automationId) {
    const automation = this.automations.get(automationId);
    if (!automation) throw new Error(`Automatización no encontrada: ${automationId}`);
    return {
      id: automation.id,
      name: automation.name,
      enabled: automation.enabled,
      executionCount: automation.executionCount,
      lastExecution: automation.lastExecution,
      errorCount: automation.errorCount
    };
  }

  async getAllAutomations() {
    return Array.from(this.automations.values());
  }
}