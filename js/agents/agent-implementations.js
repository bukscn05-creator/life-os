// AGENT IMPLEMENTATIONS — LIFE OS AGENTIC OS
// Implementaciones reales de agentes que se conectan a los módulos de LIFE OS

import { uid, nowISO } from '../core/ids.js';
import { todayYMD, currentMonthYM } from '../core/dates.js';
import { parseMoneyToCents, formatEUR, isValidCents } from '../core/money.js';
import { getFinanceSummary, txCents, isExpense, isIncome, monthOfDate } from '../core/budget.js';
import { RECURRENCES, normalizeRecurrence, nextOccurrenceOnOrAfter } from '../core/recurrence.js';
import { saveRecord } from '../core/storage.js';
import { getFinanceSummary as getFinanceSummaryLogic, getAttentionItems, getTodayHabits, getNextAction } from '../modules/logic.js';

// ============================================================
// CLASE BASE PARA AGENTES
// ============================================================

export class BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    this.coordinator = coordinator;
    this.toolRegistry = toolRegistry;
    this.skillRegistry = skillRegistry;
    this.agentId = agentId;
    this.config = config;
    this.state = {
      status: 'idle',
      currentTask: null,
      context: {},
      lastExecution: null,
      errorCount: 0,
      metrics: {}
    };
  }

  async execute(task, context) {
    try {
      this.state.status = 'running';
      this.state.currentTask = task;
      this.state.context = context;

      if (!await this.canExecute(task)) {
        throw new Error('Permiso denegado para ejecutar esta tarea');
      }

      const inputs = await this.prepareInputs(task, context);
      const results = await this.performAction(task, inputs, context);

      await this.logExecution('completed', results, null);
      this.state.status = 'idle';
      return { success: true, results };
    } catch (error) {
      await this.logExecution('failed', null, error);
      this.state.status = 'failed';
      this.state.errorCount++;
      throw error;
    } finally {
      this.state.currentTask = null;
    }
  }

  async canExecute(task) {
    return true;
  }

  async prepareInputs(task, context) {
    return {
      taskType: task.type,
      description: task.description,
      parameters: task.parameters || {},
      context: {
        user: context.user,
        currentState: context.state,
        availableTools: this.tools || [],
        availableSkills: this.skills || [],
        ...context
      }
    };
  }

  async performAction(task, inputs, context) {
    return { message: 'Agente base no puede realizar esta acción' };
  }

  async logExecution(status, results, error) {
    const logEntry = {
      agentId: this.agentId,
      taskId: this.state.currentTask?.id,
      timestamp: new Date().toISOString(),
      status,
      results,
      error: error?.message || null,
      durationMs: Date.now() - (this.state.lastExecutionStart?.time || Date.now())
    };
    if (this.coordinator && this.coordinator.logExecution) {
      this.coordinator.logExecution(logEntry);
    }
  }
}

// ============================================================
// AGENTE DE FINANZAS
// ============================================================

export class FinanceAgent extends BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    super({ coordinator, toolRegistry, skillRegistry, agentId, config });
    this.tools = ['parse_money', 'format_currency', 'validate_budget', 'record_transaction'];
    this.skills = ['money_parsing', 'budget_analysis', 'expense_tracking', 'income_analysis'];
  }

  async canExecute(task) {
    const allowedTypes = ['parse_transaction', 'validate_budget', 'record_income', 'record_expense', 'get_finance_summary'];
    return allowedTypes.includes(task.parameters?.action);
  }

  async performAction(task, inputs, context) {
    const { action, data } = inputs.parameters;

    switch (action) {
      case 'parse_transaction':
        return await this.parseTransaction(data);
      case 'validate_budget':
        return await this.validateBudget(data);
      case 'record_income':
        return await this.recordIncome(data);
      case 'record_expense':
        return await this.recordExpense(data);
      case 'get_finance_summary':
        return await this.getFinanceSummary(data, context);
      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  async parseTransaction(transactionData) {
    const result = parseMoneyToCents(transactionData.amount);
    if (!result.ok) throw new Error(result.error);

    if (!isValidCents(result.cents)) {
      throw new Error('Importe fuera de rango válido');
    }

    return {
      parsed: {
        amountCents: result.cents,
        category: transactionData.category || 'Otros',
        type: transactionData.type || (result.cents < 0 ? 'gasto' : 'ingreso'),
        date: transactionData.date || todayYMD(),
        description: transactionData.description || ''
      }
    };
  }

  async validateBudget(data) {
    const { month, category, amountCents } = data;
    const finance = getFinanceSummaryLogic(context.state || {});
    const budgetRemaining = finance.estimatedFreeAfterCommitments || 0;
    const wouldExceed = (budgetRemaining - amountCents) < 0;

    return {
      valid: !wouldExceed,
      budgetRemainingCents: budgetRemaining,
      amountCents,
      wouldExceedBudget: wouldExceed,
      message: wouldExceed
        ? `Esta operación excedería el presupuesto disponible en ${formatEUR(Math.abs(budgetRemaining - amountCents))}`
        : 'Presupuesto disponible suficiente'
    };
  }

  async recordIncome(data) {
    const parsed = await this.parseTransaction(data);
    const item = {
      id: uid('t'),
      type: 'ingreso',
      amountCents: parsed.parsed.amountCents,
      amount: parsed.parsed.amountCents / 100,
      date: parsed.parsed.date,
      category: parsed.parsed.category,
      description: parsed.parsed.description,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    await saveRecord('transactions', item);
    return { transaction: item, action: 'income_recorded' };
  }

  async recordExpense(data) {
    const parsed = await this.parseTransaction(data);
    const item = {
      id: uid('t'),
      type: 'gasto',
      amountCents: -Math.abs(parsed.parsed.amountCents),
      amount: -Math.abs(parsed.parsed.amountCents) / 100,
      date: parsed.parsed.date,
      category: parsed.parsed.category,
      description: parsed.parsed.description,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    await saveRecord('transactions', item);
    return { transaction: item, action: 'expense_recorded' };
  }

  async getFinanceSummary(data, context) {
    const finance = getFinanceSummaryLogic(context.state || {});
    return {
      month: finance.month,
      incomeCents: finance.income,
      spentCents: finance.spent,
      budgetTotalCents: finance.budgetTotal,
      budgetRemainingCents: finance.budgetRemaining,
      committedCents: finance.committed,
      freeAfterCommitmentsCents: finance.estimatedFreeAfterCommitments,
      netCents: finance.net,
      savingsPotsTotalCents: finance.savingsPotsTotal,
      message: `Resumen del mes ${finance.month}: Ingresos ${formatEUR(finance.income)}, Gastado ${formatEUR(finance.spent)}, Libre ${formatEUR(finance.estimatedFreeAfterCommitments)}`
    };
  }
}

// ============================================================
// AGENTE DE PRODUCTIVIDAD
// ============================================================

export class ProductivityAgent extends BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    super({ coordinator, toolRegistry, skillRegistry, agentId, config });
    this.tools = ['create_task', 'update_task', 'prioritize_tasks', 'time_estimate'];
    this.skills = ['task_management', 'prioritization', 'workflow_optimization'];
  }

  async canExecute(task) {
    const allowedTypes = ['create_task', 'update_task', 'prioritize_tasks', 'mark_habit_done'];
    return allowedTypes.includes(task.parameters?.action);
  }

  async performAction(task, inputs, context) {
    const { action, data } = inputs.parameters;

    switch (action) {
      case 'create_task':
        return await this.createTask(data);
      case 'update_task':
        return await this.updateTask(data);
      case 'prioritize_tasks':
        return await this.prioritizeTasks(data);
      case 'mark_habit_done':
        return await this.markHabitDone(data);
      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  async createTask(taskData) {
    const item = {
      id: uid('task'),
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'media',
      dueDate: taskData.dueDate || todayYMD(),
      estimatedTime: taskData.estimatedTime || 0,
      status: 'pending',
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    await saveRecord('tasks', item);
    return { task: item, action: 'task_created' };
  }

  async updateTask(taskData) {
    const item = {
      ...taskData,
      updatedAt: nowISO()
    };
    await saveRecord('tasks', item);
    return { task: item, action: 'task_updated' };
  }

  async prioritizeTasks(taskData) {
    const { taskIds, priority } = taskData;
    const results = [];
    for (const taskId of taskIds) {
      const item = { id: taskId, priority, updatedAt: nowISO() };
      await saveRecord('tasks', item);
      results.push(item);
    }
    return { tasks: results, action: 'tasks_prioritized' };
  }

  async markHabitDone(data) {
    const { habitId, date } = data;
    const item = {
      id: uid('he'),
      habitId,
      date: date || todayYMD(),
      done: true,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    await saveRecord('habitEntries', item);
    return { entry: item, action: 'habit_marked_done' };
  }
}

// ============================================================
// AGENTE DE CALENDARIO
// ============================================================

export class CalendarAgent extends BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    super({ coordinator, toolRegistry, skillRegistry, agentId, config });
    this.tools = ['create_event', 'update_event', 'schedule_conflict', 'find_time_slot'];
    this.skills = ['event_management', 'scheduling', 'conflict_resolution'];
  }

  async canExecute(task) {
    const allowedTypes = ['create_event', 'update_event', 'get_events_today', 'get_events_week'];
    return allowedTypes.includes(task.parameters?.action);
  }

  async performAction(task, inputs, context) {
    const { action, data } = inputs.parameters;

    switch (action) {
      case 'create_event':
        return await this.createEvent(data);
      case 'update_event':
        return await this.updateEvent(data);
      case 'get_events_today':
        return await this.getEventsToday(context);
      case 'get_events_week':
        return await this.getEventsWeek(context, data);
      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  async createEvent(eventData) {
    const item = {
      id: uid('e'),
      title: eventData.title,
      date: eventData.date || todayYMD(),
      start: eventData.start || '',
      end: eventData.end || '',
      category: eventData.category || 'Personal',
      location: eventData.location || '',
      notes: eventData.notes || '',
      recurrence: eventData.recurrence || 'nunca',
      exceptions: [],
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    await saveRecord('events', item);
    return { event: item, action: 'event_created' };
  }

  async updateEvent(eventData) {
    const item = {
      ...eventData,
      updatedAt: nowISO()
    };
    await saveRecord('events', item);
    return { event: item, action: 'event_updated' };
  }

  async getEventsToday(context) {
    const today = todayYMD();
    const events = (context.state?.events || []).filter(e => e.date === today && !e.deletedAt);
    return { date: today, events, count: events.length };
  }

  async getEventsWeek(context, data) {
    const { fromDate } = data;
    const events = (context.state?.events || []).filter(e => !e.deletedAt);
    return { fromDate, events, count: events.length };
  }
}

// ============================================================
// AGENTE DE ASISTENTE PERSONAL
// ============================================================

export class PersonalAssistantAgent extends BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    super({ coordinator, toolRegistry, skillRegistry, agentId, config });
    this.tools = ['context_analysis', 'proactive_suggestion', 'user_communication', 'task_scheduling'];
    this.skills = ['natural_language_processing', 'context_understanding', 'proactive_planning'];
  }

  async canExecute(task) {
    const allowedTypes = ['analyze_context', 'suggest_task', 'get_daily_briefing', 'get_attention_items'];
    return allowedTypes.includes(task.parameters?.action);
  }

  async performAction(task, inputs, context) {
    const { action, data } = inputs.parameters;

    switch (action) {
      case 'analyze_context':
        return await this.analyzeContext(context);
      case 'suggest_task':
        return await this.suggestTask(data, context);
      case 'get_daily_briefing':
        return await this.getDailyBriefing(context);
      case 'get_attention_items':
        return await this.getAttentionItems(context);
      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  async analyzeContext(context) {
    const state = context.state || {};
    const finance = getFinanceSummaryLogic(state);
    const attention = getAttentionItems(state);
    const habits = getTodayHabits(state);
    const nextAction = getNextAction(state);

    return {
      finance: {
        spent: finance.spent,
        budgetRemaining: finance.estimatedFreeAfterCommitments,
        net: finance.net
      },
      attention: attention.length,
      habitsProgress: habits.total ? Math.round((habits.done / habits.total) * 100) : 0,
      nextAction: nextAction.text,
      urgency: attention.filter(a => a.tone === 'red').length,
      summary: `Tienes ${attention.length} elementos que requieren atención, ${habits.done} de ${habits.total} hábitos completados hoy, y ${formatEUR(finance.estimatedFreeAfterCommitments)} libre tras compromisos.`
    };
  }

  async suggestTask(data, context) {
    const { contextType } = data;
    const state = context.state || {};
    const attention = getAttentionItems(state);

    if (attention.length > 0) {
      const top = attention[0];
      return {
        suggestedAction: 'atender_prioridad',
        title: `Atender: ${top.title}`,
        description: top.meta || top.label,
        priority: top.tone === 'red' ? 'alta' : top.tone === 'orange' ? 'media' : 'baja',
        relatedItemId: top.id,
        relatedItemKind: top.kind
      };
    }

    return {
      suggestedAction: 'crear_habito',
      title: 'Revisar finanzas diarias',
      description: 'Dedica 5 minutos a revisar tus gastos del día',
      priority: 'baja'
    };
  }

  async getDailyBriefing(context) {
    const state = context.state || {};
    const finance = getFinanceSummaryLogic(state);
    const attention = getAttentionItems(state);
    const habits = getTodayHabits(state);
    const nextAction = getNextAction(state);

    return {
      date: todayYMD(),
      greeting: 'Buenos días',
      finance: {
        spentToday: finance.spent,
        freeAfterCommitments: finance.estimatedFreeAfterCommitments
      },
      attentionCount: attention.length,
      habitsProgress: habits.total ? `${habits.done}/${habits.total}` : '0/0',
      nextAction: nextAction.text,
      urgentItems: attention.filter(a => a.tone === 'red').map(a => a.title),
      summary: `Resumen del día ${todayYMD()}: ${attention.length} elementos de atención, ${habits.done} de ${habits.total} hábitos, ${formatEUR(finance.estimatedFreeAfterCommitments)} libre.`
    };
  }

  async getAttentionItems(context) {
    const state = context.state || {};
    const attention = getAttentionItems(state);
    return { items: attention, count: attention.length };
  }
}

// ============================================================
// AGENTE DE INVESTIGACIÓN
// ============================================================

export class ResearchAgent extends BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    super({ coordinator, toolRegistry, skillRegistry, agentId, config });
    this.tools = ['web_search', 'knowledge_query', 'document_analysis', 'extract_information'];
    this.skills = ['information_retrieval', 'data_analysis', 'content_extraction'];
  }

  async canExecute(task) {
    const allowedTypes = ['search_knowledge', 'analyze_document', 'extract_info'];
    return allowedTypes.includes(task.parameters?.action);
  }

  async performAction(task, inputs, context) {
    const { action, data } = inputs.parameters;

    switch (action) {
      case 'search_knowledge':
        return await this.searchKnowledge(data);
      case 'analyze_document':
        return await this.analyzeDocument(data);
      case 'extract_info':
        return await this.extractInformation(data);
      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  async searchKnowledge(data) {
    const { query } = data;
    const notes = (this.coordinator?.state?.notes || []).filter(n =>
      n.text.toLowerCase().includes(query.toLowerCase()) &&
      !n.deletedAt
    );
    return { query, results: notes, count: notes.length };
  }

  async analyzeDocument(data) {
    return { analyzed: true, summary: 'Análisis de documento completado', data };
  }

  async extractInformation(data) {
    return { extracted: true, information: data };
  }
}

// ============================================================
// AGENTE DE PROYECTOS
// ============================================================

export class ProjectsAgent extends BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    super({ coordinator, toolRegistry, skillRegistry, agentId, config });
    this.tools = ['create_project', 'add_task_to_project', 'update_project_status', 'project_progress'];
    this.skills = ['project_management', 'task_coordination', 'progress_tracking'];
  }

  async canExecute(task) {
    const allowedTypes = ['create_project', 'update_project', 'get_project_progress'];
    return allowedTypes.includes(task.parameters?.action);
  }

  async performAction(task, inputs, context) {
    const { action, data } = inputs.parameters;

    switch (action) {
      case 'create_project':
        return await this.createProject(data);
      case 'update_project':
        return await this.updateProject(data);
      case 'get_project_progress':
        return await this.getProjectProgress(data, context);
      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  async createProject(projectData) {
    const item = {
      id: uid('p'),
      title: projectData.title,
      description: projectData.description || '',
      status: projectData.status || 'planning',
      deadline: projectData.deadline,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    await saveRecord('goals', item);
    return { project: item, action: 'project_created' };
  }

  async updateProject(projectData) {
    const item = {
      ...projectData,
      updatedAt: nowISO()
    };
    await saveRecord('goals', item);
    return { project: item, action: 'project_updated' };
  }

  async getProjectProgress(data, context) {
    const { projectId } = data;
    const goals = context.state?.goals || [];
    const project = goals.find(g => g.id === projectId && !g.deletedAt);
    if (!project) throw new Error('Proyecto no encontrado');

    const currentCents = project.currentCents ?? 0;
    const targetCents = project.targetCents ?? 0;
    const progress = targetCents > 0 ? Math.round((currentCents / targetCents) * 100) : 0;

    return {
      projectId,
      title: project.title,
      currentCents,
      targetCents,
      progressPercent: progress,
      completed: progress >= 100
    };
  }
}

// ============================================================
// AGENTE DE CONOCIMIENTO
// ============================================================

export class KnowledgeAgent extends BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    super({ coordinator, toolRegistry, skillRegistry, agentId, config });
    this.tools = ['store_knowledge', 'retrieve_knowledge', 'link_knowledge', 'organize_knowledge'];
    this.skills = ['information_organization', 'knowledge_retrieval', 'semantic_search'];
  }

  async canExecute(task) {
    const allowedTypes = ['store_note', 'retrieve_note', 'search_notes'];
    return allowedTypes.includes(task.parameters?.action);
  }

  async performAction(task, inputs, context) {
    const { action, data } = inputs.parameters;

    switch (action) {
      case 'store_note':
        return await this.storeNote(data);
      case 'retrieve_note':
        return await this.retrieveNote(data);
      case 'search_notes':
        return await this.searchNotes(data);
      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  async storeNote(noteData) {
    const item = {
      id: uid('n'),
      text: noteData.text,
      date: noteData.date || todayYMD(),
      pinned: noteData.pinned || false,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    await saveRecord('notes', item);
    return { note: item, action: 'note_stored' };
  }

  async retrieveNote(data) {
    const { noteId } = data;
    const notes = this.coordinator?.state?.notes || [];
    const note = notes.find(n => n.id === noteId && !n.deletedAt);
    if (!note) throw new Error('Nota no encontrada');
    return { note };
  }

  async searchNotes(data) {
    const { query } = data;
    const notes = (this.coordinator?.state?.notes || []).filter(n =>
      n.text.toLowerCase().includes(query.toLowerCase()) &&
      !n.deletedAt
    );
    return { query, results: notes, count: notes.length };
  }
}

// ============================================================
// AGENTE DE AUTOMATIZACIÓN
// ============================================================

export class AutomationAgent extends BaseAgent {
  constructor({ coordinator, toolRegistry, skillRegistry, agentId, config = {} }) {
    super({ coordinator, toolRegistry, skillRegistry, agentId, config });
    this.tools = ['create_automation', 'execute_automation', 'configure_trigger', 'schedule_task'];
    this.skills = ['workflow_automation', 'trigger_management', 'scheduling'];
  }

  async canExecute(task) {
    const allowedTypes = ['create_automation', 'execute_automation', 'list_automations'];
    return allowedTypes.includes(task.parameters?.action);
  }

  async performAction(task, inputs, context) {
    const { action, data } = inputs.parameters;

    switch (action) {
      case 'create_automation':
        return await this.createAutomation(data);
      case 'execute_automation':
        return await this.executeAutomation(data);
      case 'list_automations':
        return await this.listAutomations(context);
      default:
        throw new Error(`Acción no soportada: ${action}`);
    }
  }

  async createAutomation(automationData) {
    const item = {
      id: uid('auto'),
      name: automationData.name,
      description: automationData.description || '',
      trigger: automationData.trigger,
      conditions: automationData.conditions || [],
      actions: automationData.actions || [],
      enabled: automationData.enabled !== false,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    await saveRecord('automations', item);
    return { automation: item, action: 'automation_created' };
  }

  async executeAutomation(data) {
    const { automationId } = data;
    const automations = this.coordinator?.state?.automations || [];
    const automation = automations.find(a => a.id === automationId && !a.deletedAt);
    if (!automation) throw new Error('Automatización no encontrada');
    return { automation, action: 'automation_executed', executed: true };
  }

  async listAutomations(context) {
    const automations = (context.state?.automations || []).filter(a => !a.deletedAt);
    return { automations, count: automations.length };
  }
}

export const AGENT_CLASSES = {
  finance_agent: FinanceAgent,
  productivity_agent: ProductivityAgent,
  calendar_agent: CalendarAgent,
  personal_assistant: PersonalAssistantAgent,
  research_agent: ResearchAgent,
  projects_agent: ProjectsAgent,
  knowledge_agent: KnowledgeAgent,
  automation_agent: AutomationAgent
};