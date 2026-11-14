// EXECUTION ENGINE — LIFE OS AGENTIC OS
// Motor de ejecución de tareas de agentes

export class ExecutionEngine {
  constructor(agentRegistry, coordinator, toolRegistry, skillRegistry, logger) {
    this.registry = agentRegistry;
    this.coordinator = coordinator;
    this.toolRegistry = toolRegistry;
    this.skillRegistry = skillRegistry;
    this.logger = logger;
    this.executions = new Map();
    this.taskQueue = [];
    this.runningExecutions = new Map();
  }

  async submitTask(task, context) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const agent = await this.selectAgent(task, context);
    if (!agent) {
      throw new Error('No hay agentes disponibles para esta tarea');
    }

    const execution = {
      id: executionId,
      task,
      context,
      agentId: agent.id,
      status: 'pending',
      startTime: new Date().toISOString(),
      steps: [],
      results: null,
      error: null,
      progress: 0
    };

    this.executions.set(executionId, execution);

    this.runExecution(executionId).catch(() => {});

    return { executionId, status: 'pending' };
  }

  async runExecution(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Ejecución no encontrada: ${executionId}`);
    }

    try {
      execution.status = 'running';
      execution.steps.push({
        id: `step_${Date.now()}`,
        name: 'inicio',
        status: 'completed',
        timestamp: new Date().toISOString()
      });

      const agent = this.registry.get(execution.agentId);
      if (!agent) {
        throw new Error(`Agente no encontrado: ${execution.agentId}`);
      }

      const result = await agent.performAction(execution.task, execution.context);

      execution.status = 'completed';
      execution.results = result;
      execution.endTime = new Date().toISOString();

      execution.steps.push({
        id: `step_${Date.now()}`,
        name: 'completado',
        status: 'completed',
        timestamp: new Date().toISOString(),
        output: result
      });

      if (this.coordinator && this.coordinator.logExecution) {
        this.coordinator.logExecution(execution);
      }

    } catch (error) {
      execution.status = 'failed';
      execution.error = error;
      execution.endTime = new Date().toISOString();

      execution.steps.push({
        id: `step_${Date.now()}`,
        name: 'error',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error.message
      });

      if (this.coordinator && this.coordinator.logExecution) {
        this.coordinator.logExecution(execution);
      }
      throw error;
    }
  }

  async getExecutionStatus(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Ejecución no encontrada: ${executionId}`);
    }
    return {
      id: execution.id,
      status: execution.status,
      task: execution.task,
      progress: execution.progress,
      steps: execution.steps,
      results: execution.results,
      error: execution.error,
      startTime: execution.startTime,
      endTime: execution.endTime
    };
  }

  async cancelExecution(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) return false;
    if (execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date().toISOString();
      return true;
    }
    return false;
  }

  async pauseExecution(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') return false;
    execution.status = 'paused';
    return true;
  }

  async resumeExecution(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'paused') return false;
    execution.status = 'running';
    return true;
  }

  async selectAgent(task, context) {
    const agents = this.registry.find(agent => true);
    if (!agents.length) return null;

    agents.sort((a, b) => {
      const aScore = this.scoreAgent(a, task.type);
      const bScore = this.scoreAgent(b, task.type);
      return bScore - aScore;
    });

    return agents[0];
  }

  scoreAgent(agent, taskType) {
    let score = 0;
    const statusScores = { idle: 3, running: 2, waiting: 1, completed: 3, failed: 0, paused: 1 };
    score += statusScores[agent.status] || 1;
    score += agent.skills.length * 0.5;
    score += agent.tools.length * 0.5;
    return score;
  }

  async getSupportedTaskTypes(context) {
    const agents = this.registry.find(agent => true);
    const types = new Set();
    agents.forEach(agent => {
      if (agent.type === 'finance_agent') {
        types.add('parse_transaction');
        types.add('validate_budget');
        types.add('record_income');
      }
      if (agent.type === 'productivity_agent') {
        types.add('create_task');
        types.add('update_task');
        types.add('prioritize_tasks');
      }
      if (agent.type === 'calendar_agent') {
        types.add('create_event');
        types.add('update_event');
        types.add('schedule_conflict');
      }
    });
    return Array.from(types);
  }
}