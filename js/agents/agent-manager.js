// AGENT MANAGER — LIFE OS Agentic OS Manager
// Coordinador central para AGENTIC OS con agentes funcionales

import { AgentRegistry } from './agent-types.js';
import { ToolRegistry } from './tool-types.js';
import { SkillRegistry } from './skill-types.js';
import { ExecutionEngine } from './execution-engine.js';
import { AutomationEngine } from './automation-engine.js';
import { ExecutionLogger } from './execution-logger.js';
import { AgentConfig } from './agent-config.js';
import { AGENT_CLASSES } from './agent-implementations.js';

export class AgentManager {
  constructor() {
    this.config = new AgentConfig();
    this.registry = new AgentRegistry();
    this.toolRegistry = new ToolRegistry();
    this.skillRegistry = new SkillRegistry();
    this.executionLogger = new ExecutionLogger();
    this.executionEngine = new ExecutionEngine(
      this.registry,
      this,
      this.toolRegistry,
      this.skillRegistry,
      this.executionLogger
    );
    this.automationEngine = new AutomationEngine(this, this.executionEngine);
    this.initialized = false;
    this.state = {};
  }

  async boot() {
    try {
      await this.loadConfiguration();
      await this.loadDefaultToolsAndSkills();
      await this.registerDefaultAgents();
      this.initialized = true;
    } catch (error) {
      throw error;
    }
  }

  async loadConfiguration() {
    try {
      const config = AgentConfig.getDefaultConfig();
      this.config = config;
    } catch {
    }
  }

  async loadDefaultToolsAndSkills() {
    const defaultTools = [
      {
        name: 'parse_money',
        displayName: 'Analizar dinero',
        description: 'Analiza texto de dinero a céntimos',
        category: 'finanzas',
        parameters: [
          { name: 'amount', type: 'string', required: true }
        ],
        returns: { amountCents: 'number', category: 'string' }
      },
      {
        name: 'format_currency',
        displayName: 'Formatear moneda',
        description: 'Formatea céntimos a moneda local',
        category: 'finanzas',
        parameters: [
          { name: 'cents', type: 'number', required: true },
          { name: 'currency', type: 'string', required: false }
        ],
        returns: { formatted: 'string' }
      },
      {
        name: 'create_task',
        displayName: 'Crear tarea',
        description: 'Crea una nueva tarea',
        category: 'productividad',
        parameters: [
          { name: 'title', type: 'string', required: true },
          { name: 'description', type: 'string', required: false }
        ],
        returns: { task: 'object' }
      },
      {
        name: 'create_event',
        displayName: 'Crear evento',
        description: 'Crea un nuevo evento en calendario',
        category: 'calendario',
        parameters: [
          { name: 'title', type: 'string', required: true },
          { name: 'date', type: 'date', required: true },
          { name: 'start', type: 'string', required: false },
          { name: 'end', type: 'string', required: false }
        ],
        returns: { event: 'object' }
      },
      {
        name: 'store_note',
        displayName: 'Guardar nota',
        description: 'Guarda una nota en el conocimiento',
        category: 'conocimiento',
        parameters: [
          { name: 'text', type: 'string', required: true },
          { name: 'date', type: 'string', required: false }
        ],
        returns: { note: 'object' }
      }
    ];

    for (const toolDef of defaultTools) {
      this.toolRegistry.register(toolDef);
    }

    const defaultSkills = [
      {
        name: 'money_parsing',
        displayName: 'Analizar dinero',
        description: 'Habilidad para analizar texto de dinero',
        category: 'finanzas',
        requiredTools: ['parse_money'],
        complexity: 'simple'
      },
      {
        name: 'task_management',
        displayName: 'Gestión de tareas',
        description: 'Habilidad para crear y gestionar tareas',
        category: 'productividad',
        requiredTools: ['create_task'],
        complexity: 'simple'
      },
      {
        name: 'event_management',
        displayName: 'Gestión de eventos',
        description: 'Habilidad para crear y actualizar eventos',
        category: 'calendario',
        requiredTools: ['create_event'],
        complexity: 'simple'
      },
      {
        name: 'knowledge_retrieval',
        displayName: 'Recuperación de conocimiento',
        description: 'Habilidad para buscar y recuperar notas',
        category: 'conocimiento',
        requiredTools: ['store_note'],
        complexity: 'simple'
      }
    ];

    for (const skillDef of defaultSkills) {
      this.skillRegistry.register(skillDef);
    }
  }

  async registerDefaultAgents() {
    const agentConfigs = this.config.agents;

    for (const [agentId, agentConfig] of Object.entries(agentConfigs)) {
      if (!agentConfig.enabled) continue;

      const AgentClass = AGENT_CLASSES[agentId];
      if (!AgentClass) continue;

      const agentInstance = new AgentClass({
        coordinator: this,
        toolRegistry: this.toolRegistry,
        skillRegistry: this.skillRegistry,
        agentId,
        config: agentConfig.configuration
      });

      const descriptor = {
        id: agentId,
        type: agentId,
        name: agentInstance.name || agentId,
        description: agentInstance.description || '',
        capabilities: agentInstance.capabilities || [],
        tools: agentInstance.tools || [],
        skills: agentInstance.skills || [],
        permissions: agentConfig.permissions || { read: [], write: [], external: [] },
        configuration: agentConfig.configuration || {},
        status: 'idle'
      };

      this.registry.register(descriptor);

      agentInstance.tools.forEach(tool => {
        this.toolRegistry.assignToolToAgent(agentId, tool);
      });

      agentInstance.skills.forEach(skill => {
        this.skillRegistry.assignSkillToAgent(agentId, skill);
      });
    }
  }

  async loadState(state) {
    this.state = state;
  }

  async receiveUserRequest(input) {
    if (!this.initialized) {
      throw new Error('Agent Manager no inicializado');
    }

    try {
      return await this.coordinateRequest(input);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async coordinateRequest(input) {
    const parsedInput = await this.parseUserInput(input);
    if (!parsedInput) {
      return {
        success: false,
        error: 'No se pudo entender la solicitud',
        timestamp: new Date().toISOString()
      };
    }

    const relevantAgents = this.selectAgents(parsedInput);
    if (!relevantAgents.length) {
      return {
        success: false,
        error: 'No hay agentes disponibles para esta solicitud',
        timestamp: new Date().toISOString()
      };
    }

    const bestAgent = this.selectBestAgent(relevantAgents, parsedInput);

    try {
      const agentInstance = this.getAgentInstance(bestAgent.id);
      if (!agentInstance) {
        throw new Error(`No se pudo instanciar el agente: ${bestAgent.id}`);
      }

      const task = {
        type: parsedInput.intent,
        description: parsedInput.originalInput,
        parameters: parsedInput.parameters,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        context: {
          user: 'current_user',
          timestamp: new Date().toISOString(),
          availableTools: bestAgent.tools,
          availableSkills: bestAgent.skills,
          state: this.state,
          ...parsedInput
        }
      };

      const result = await agentInstance.execute(task, task.context);

      return {
        success: true,
        agentId: bestAgent.id,
        agentName: bestAgent.name,
        result: result.results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        agentId: bestAgent.id,
        timestamp: new Date().toISOString()
      };
    }
  }

  getAgentInstance(agentId) {
    const AgentClass = AGENT_CLASSES[agentId];
    if (!AgentClass) return null;
    return new AgentClass({
      coordinator: this,
      toolRegistry: this.toolRegistry,
      skillRegistry: this.skillRegistry,
      agentId,
      config: this.config.agents[agentId]?.configuration || {}
    });
  }

  parseUserInput(input) {
    const lowerInput = input.toLowerCase();

    const patterns = [
      {
        pattern: /(cuanto|cuánto).*gast[ae].*mes/i,
        intent: 'analizar_finanzas',
        confidence: 0.9
      },
      {
        pattern: /(gaste|gasté).*en/i,
        intent: 'record_expense',
        confidence: 0.8
      },
      {
        pattern: /(ingreso|ingresé).*de/i,
        intent: 'record_income',
        confidence: 0.8
      },
      {
        pattern: /crear.*tarea/i,
        intent: 'create_task',
        confidence: 0.8
      },
      {
        pattern: /(crear|agendar).*evento/i,
        intent: 'create_event',
        confidence: 0.8
      },
      {
        pattern: /presupuesto/i,
        intent: 'get_finance_summary',
        confidence: 0.7
      },
      {
        pattern: /resumen.*día|briefing/i,
        intent: 'get_daily_briefing',
        confidence: 0.7
      },
      {
        pattern: /atención|urgente/i,
        intent: 'get_attention_items',
        confidence: 0.7
      },
      {
        pattern: /guardar.*nota|nota.*guardar/i,
        intent: 'store_note',
        confidence: 0.7
      },
      {
        pattern: /crear.*proyecto/i,
        intent: 'create_project',
        confidence: 0.7
      },
      {
        pattern: /buscar.*nota|nota.*buscar/i,
        intent: 'search_notes',
        confidence: 0.7
      }
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern.pattern);
      if (match) {
        return {
          intent: pattern.intent,
          confidence: pattern.confidence,
          parameters: {},
          originalInput: input
        };
      }
    }

    return null;
  }

  selectAgents(parsedInput) {
    const intentToAgentTypes = {
      'analizar_finanzas': ['finance_agent', 'personal_assistant'],
      'get_finance_summary': ['finance_agent', 'personal_assistant'],
      'record_expense': ['finance_agent'],
      'record_income': ['finance_agent'],
      'create_task': ['productivity_agent', 'personal_assistant'],
      'create_event': ['calendar_agent', 'personal_assistant'],
      'get_daily_briefing': ['personal_assistant'],
      'get_attention_items': ['personal_assistant'],
      'store_note': ['knowledge_agent'],
      'search_notes': ['knowledge_agent'],
      'create_project': ['projects_agent', 'personal_assistant']
    };

    const agentTypes = intentToAgentTypes[parsedInput.intent] || [];
    const agents = [];
    for (const agentType of agentTypes) {
      const typeAgents = this.registry.findByType(agentType);
      agents.push(...typeAgents);
    }

    return agents.filter(agent => agent.status !== 'failed' && agent.status !== 'paused');
  }

  selectBestAgent(agents, parsedInput) {
    agents.sort((a, b) => {
      const aScore = this.scoreAgent(a, parsedInput.intent);
      const bScore = this.scoreAgent(b, parsedInput.intent);
      return bScore - aScore;
    });
    return agents[0];
  }

  scoreAgent(agent, intent) {
    let score = 0;
    const statusScores = { idle: 3, running: 2, waiting: 1, completed: 3, failed: 0, paused: 1 };
    score += statusScores[agent.status] || 1;
    score += agent.skills.length * 0.5;
    score += agent.tools.length * 0.5;
    return score;
  }

  getAgentStatus() {
    if (!this.initialized) return [];
    return this.registry.find(agent => true).map(agent => ({
      id: agent.id,
      type: agent.type,
      name: agent.name,
      status: agent.status,
      tools: agent.tools,
      skills: agent.skills,
      lastExecution: agent.lastExecution,
      executionCount: agent.executionCount,
      errorCount: agent.errorCount
    }));
  }

  configureAgent(agentId, config) {
    if (!this.initialized) {
      throw new Error('Agent Manager no inicializado');
    }
    this.registry.update(agentId, config);
  }

  async shutdown() {
    for (const [executionId, execution] of this.executionEngine.executions.entries()) {
      if (execution.status === 'running') {
        await this.executionEngine.cancelExecution(executionId);
      }
    }
    this.initialized = false;
  }

  logExecution(execution) {
    this.executionLogger.logExecution(execution);
  }
}