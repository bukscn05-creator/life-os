// AGENT CONFIG — LIFE OS AGENTIC OS
// Configuración de agentes

export class AgentConfig {
  constructor() {
    this.agents = {
      finance_agent: {
        enabled: true,
        tools: ['parse_money', 'format_currency', 'validate_budget', 'record_transaction'],
        skills: ['money_parsing', 'budget_analysis', 'expense_tracking', 'income_analysis'],
        permissions: {
          read: ['transactions', 'budgets', 'subscriptions'],
          write: ['transactions', 'budgets'],
          external: []
        },
        configuration: {
          autoCategorize: true,
          defaultCurrency: 'EUR',
          budgetAlerts: true
        }
      },
      productivity_agent: {
        enabled: true,
        tools: ['create_task', 'update_task', 'prioritize_tasks', 'time_estimate'],
        skills: ['task_management', 'prioritization', 'workflow_optimization'],
        permissions: {
          read: ['tasks', 'habits'],
          write: ['tasks', 'habits'],
          external: []
        },
        configuration: {
          defaultPriority: 'media',
          workingHours: [9, 17],
          breakIntervals: 60
        }
      },
      calendar_agent: {
        enabled: true,
        tools: ['create_event', 'update_event', 'schedule_conflict', 'find_time_slot'],
        skills: ['event_management', 'scheduling', 'conflict_resolution'],
        permissions: {
          read: ['events'],
          write: ['events'],
          external: []
        },
        configuration: {
          defaultEventDuration: 60,
          reminderHours: [24, 2],
          workWeekStartsOn: 1
        }
      },
      research_agent: {
        enabled: true,
        tools: ['web_search', 'knowledge_query', 'document_analysis', 'extract_information'],
        skills: ['information_retrieval', 'data_analysis', 'content_extraction'],
        permissions: {
          read: ['*'],
          write: [],
          external: ['web']
        },
        configuration: {}
      },
      projects_agent: {
        enabled: true,
        tools: ['create_project', 'add_task_to_project', 'update_project_status', 'project_progress'],
        skills: ['project_management', 'task_coordination', 'progress_tracking'],
        permissions: {
          read: ['projects', 'tasks'],
          write: ['projects', 'tasks'],
          external: []
        },
        configuration: {
          defaultProjectStatus: 'planning',
          autoProgressTracking: true
        }
      },
      knowledge_agent: {
        enabled: true,
        tools: ['store_knowledge', 'retrieve_knowledge', 'link_knowledge', 'organize_knowledge'],
        skills: ['information_organization', 'knowledge_retrieval', 'semantic_search'],
        permissions: {
          read: ['knowledge', 'notes'],
          write: ['knowledge', 'notes'],
          external: []
        },
        configuration: {
          autoLinkProjects: true,
          semanticSearchThreshold: 0.8
        }
      },
      automation_agent: {
        enabled: true,
        tools: ['create_automation', 'execute_automation', 'configure_trigger', 'schedule_task'],
        skills: ['workflow_automation', 'trigger_management', 'scheduling'],
        permissions: {
          read: ['automations', 'tasks', 'events'],
          write: ['automations'],
          external: []
        },
        configuration: {
          maxConcurrentAutomations: 10,
          defaultRetryPolicy: { maxRetries: 3, backoffMultiplier: 2 }
        }
      },
      personal_assistant: {
        enabled: true,
        tools: ['context_analysis', 'proactive_suggestion', 'user_communication', 'task_scheduling'],
        skills: ['natural_language_processing', 'context_understanding', 'proactive_planning'],
        permissions: {
          read: ['*'],
          write: ['*'],
          external: []
        },
        configuration: {
          proactiveLevel: 'medio',
          learnFromUser: true,
          suggestDailyAgenda: true
        }
      }
    };

    this.global = {
      maxConcurrentExecutions: 5,
      executionTimeoutMs: 300000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxDelayMs: 60000
      },
      logging: {
        level: 'info',
        persistExecutions: true,
        maxExecutionHistory: 1000
      }
    };
  }

  static getDefaultConfig() {
    return new AgentConfig();
  }

  validateConfig(config) {
    const errors = [];

    for (const [agentId, agentConfig] of Object.entries(config.agents)) {
      if (!agentConfig.enabled) continue;
      if (!agentConfig.tools || !Array.isArray(agentConfig.tools)) {
        errors.push(`Herramientas requeridas para agente ${agentId}`);
      }
      if (!agentConfig.skills || !Array.isArray(agentConfig.skills)) {
        errors.push(`Skills requeridas para agente ${agentId}`);
      }
      if (!agentConfig.permissions) {
        errors.push(`Permisos requeridos para agente ${agentId}`);
      }
    }

    if (!config.global) {
      errors.push('Configuración global requerida');
    }

    return { valid: errors.length === 0, errors };
  }

  getAgentConfig(agentId) {
    return this.agents[agentId] || null;
  }

  setAgentConfig(agentId, config) {
    this.agents[agentId] = { ...this.agents[agentId], ...config };
  }

  isAgentEnabled(agentId) {
    const agentConfig = this.agents[agentId];
    return agentConfig ? agentConfig.enabled : false;
  }
}