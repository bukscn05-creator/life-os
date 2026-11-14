// Tests unitarios para AGENTIC OS - ExecutionEngine y AutomationEngine
import assert from 'node:assert/strict';
import { AgentRegistry } from '../../js/agents/agent-types.js';
import { ToolRegistry } from '../../js/agents/tool-types.js';
import { SkillRegistry } from '../../js/agents/skill-types.js';
import { ExecutionEngine } from '../../js/agents/execution-engine.js';
import { AutomationEngine } from '../../js/agents/automation-engine.js';

// Mock coordinator
const mockCoordinator = {
  logExecution: () => {}
};

const test = async () => {
  // ========== Test ExecutionEngine ==========
  const registry = new AgentRegistry();
  const toolRegistry = new ToolRegistry();
  const skillRegistry = new SkillRegistry();
  const executionEngine = new ExecutionEngine(
    registry,
    mockCoordinator,
    toolRegistry,
    skillRegistry,
    null
  );

  // Registrar un agente de prueba
  registry.register({
    id: 'test_agent',
    type: 'test_agent',
    name: 'Agente de Prueba',
    description: 'Agente para pruebas',
    tools: ['tool1'],
    skills: ['skill1'],
    permissions: { read: ['*'], write: [], external: [] },
    configuration: {},
    status: 'idle'
  });

  // Test 1: Enviar tarea
  const result = await executionEngine.submitTask(
    { type: 'test_task', description: 'Tarea de prueba', parameters: {} },
    { userId: 'test_user' }
  );
  assert.ok(result.executionId, 'ID de ejecución generado');
  assert.strictEqual(result.status, 'pending', 'Estado inicial pendiente');

  // Test 2: Obtener estado de ejecución
  const status = await executionEngine.getExecutionStatus(result.executionId);
  assert.ok(status, 'Estado de ejecución obtenido');
  assert.ok(['pending', 'running', 'completed', 'failed'].includes(status.status), 'Estado válido');

  // Test 3: Cancelar ejecución (puede completarse antes si es muy rápida)
  await executionEngine.cancelExecution(result.executionId);
  const cancelledStatus = await executionEngine.getExecutionStatus(result.executionId);
  assert.ok(['cancelled', 'completed'].includes(cancelledStatus.status), 'Ejecución cancelada o completada');

  // Test 4: Pausar y reanudar (puede completarse antes si es muy rápida)
  const result2 = await executionEngine.submitTask(
    { type: 'test_task', description: 'Tarea 2', parameters: {} },
    { userId: 'test_user' }
  );
  await executionEngine.pauseExecution(result2.executionId);
  const pausedStatus = await executionEngine.getExecutionStatus(result2.executionId);
  assert.ok(['paused', 'completed'].includes(pausedStatus.status), 'Ejecución pausada o completada');

  if (pausedStatus.status === 'paused') {
    await executionEngine.resumeExecution(result2.executionId);
    const resumedStatus = await executionEngine.getExecutionStatus(result2.executionId);
    assert.ok(['running', 'completed'].includes(resumedStatus.status), 'Ejecución reanudada o completada');
  }

  // ========== Test AutomationEngine ==========
  const automationEngine = new AutomationEngine(mockCoordinator, executionEngine);

  // Test 5: Crear automatización
  const automationId = await automationEngine.createAutomation({
    id: 'test_automation',
    name: 'Automatización de Prueba',
    description: 'Automatización para pruebas',
    trigger: { type: 'daily', time: '09:00' },
    conditions: [
      { type: 'if_amount', resource: 'spent', threshold: 1000 }
    ],
    actions: [
      { type: 'send_notification', message: 'Presupuesto alerta' }
    ],
    enabled: true
  });
  assert.strictEqual(automationId, 'test_automation', 'ID de automatización');

  // Test 6: Validar automatización
  const validation = await automationEngine.validateAutomation({
    id: 'test',
    name: 'Test',
    trigger: { type: 'daily', time: '09:00' },
    actions: [{ type: 'notify', message: 'test' }]
  });
  assert.strictEqual(validation.valid, true, 'Automatización válida');

  // Test 7: Validar automatización inválida
  const invalidValidation = await automationEngine.validateAutomation({
    name: 'Sin ID',
    trigger: { type: 'daily' },
    actions: []
  });
  assert.strictEqual(invalidValidation.valid, false, 'Automatización inválida detectada');
  assert.ok(invalidValidation.errors.length > 0, 'Errores reportados');

  // Test 8: Evaluar condición
  const conditionResult = await automationEngine.evaluateCondition(
    { type: 'daily', time: new Date().getHours() + ':' + new Date().getMinutes() },
    { date: new Date().toISOString().split('T')[0] }
  );
  // Esta condición puede pasar o no dependiendo del tiempo exacto, solo verificamos que retorne boolean
  assert.ok(typeof conditionResult === 'boolean', 'Condición retorna boolean');

  // Test output handled by test framework
};

test().catch(error => {
  process.exit(1);
});