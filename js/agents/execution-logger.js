// EXECUTION LOGGER — LIFE OS AGENTIC OS
// Registro y auditoría de ejecuciones de agentes

export class ExecutionLogger {
  constructor() {
    this.executions = new Map();
    this.globalExecutions = new Map();
  }

  logExecution(execution) {
    this.globalExecutions.set(execution.id, execution);

    if (!this.executions.has(execution.agentId)) {
      this.executions.set(execution.agentId, []);
    }

    const agentExecutions = this.executions.get(execution.agentId);
    agentExecutions.unshift(execution);

    if (agentExecutions.length > 1000) {
      agentExecutions.splice(1000);
    }
  }

  async getExecutionHistory(agentId, limit = 100) {
    const agentExecutions = this.executions.get(agentId) || [];
    return agentExecutions.slice(0, limit);
  }

  getExecutionById(executionId) {
    return this.globalExecutions.get(executionId) || null;
  }

  async cleanupOldExecutions(maxAge = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();

    for (const [agentId, agentExecutions] of this.executions.entries()) {
      const filtered = agentExecutions.filter(exec => {
        return now - new Date(exec.timestamp).getTime() < maxAge;
      });
      this.executions.set(agentId, filtered);
    }

    for (const [executionId, execution] of this.globalExecutions.entries()) {
      if (now - new Date(execution.timestamp).getTime() > maxAge) {
        this.globalExecutions.delete(executionId);
      }
    }
  }

  async persistExecution(execution) {
    const state = await this.loadAllState();
    if (!state.agentExecutions) {
      state.agentExecutions = [];
    }
    state.agentExecutions.unshift(execution);

    const backup = {
      app: 'LIFE_OS',
      schema: 2,
      exportedAt: new Date().toISOString(),
      stores: {
        agentExecutions: state.agentExecutions,
        migrationBackups: []
      }
    };
  }

  async loadAllState() {
    try {
      const result = await loadAllState();
      return result.state;
    } catch {
      return {};
    }
  }
}