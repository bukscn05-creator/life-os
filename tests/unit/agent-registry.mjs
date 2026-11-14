// Tests unitarios para AGENTIC OS - AgentRegistry
import assert from 'node:assert/strict';
import { AgentRegistry, AgentDescriptor, AGENT_TYPES, AGENT_STATUSES } from '../../js/agents/agent-types.js';

const test = async () => {
  // Test 1: Crear registro de agentes
  const registry = new AgentRegistry();
  assert.ok(registry, 'Registro de agentes creado');

  // Test 2: Registrar un agente
  const descriptor = new AgentDescriptor({
    id: 'test_agent_1',
    type: AGENT_TYPES.FINANCE,
    name: 'Agente de Prueba',
    description: 'Agente para pruebas unitarias',
    tools: ['tool1', 'tool2'],
    skills: ['skill1'],
    permissions: { read: ['test'], write: [], external: [] },
    status: AGENT_STATUSES.IDLE
  });

  const agentId = registry.register(descriptor);
  assert.strictEqual(agentId, 'test_agent_1', 'ID del agente registrado');

  // Test 3: Obtener agente por ID
  const agent = registry.get('test_agent_1');
  assert.ok(agent, 'Agente obtenido por ID');
  assert.strictEqual(agent.name, 'Agente de Prueba', 'Nombre del agente correcto');
  assert.strictEqual(agent.status, AGENT_STATUSES.IDLE, 'Estado del agente correcto');

  // Test 4: Buscar agentes por tipo
  const financeAgents = registry.findByType(AGENT_TYPES.FINANCE);
  assert.strictEqual(financeAgents.length, 1, 'Un agente de finanzas encontrado');

  // Test 5: Buscar agentes por herramienta
  const agentsWithTool1 = registry.findByTool('tool1');
  assert.strictEqual(agentsWithTool1.length, 1, 'Un agente con tool1 encontrado');

  // Test 6: Buscar agentes por skill
  const agentsWithSkill1 = registry.findBySkill('skill1');
  assert.strictEqual(agentsWithSkill1.length, 1, 'Un agente con skill1 encontrado');

  // Test 7: Actualizar agente
  const updated = registry.update('test_agent_1', { status: AGENT_STATUSES.RUNNING });
  assert.strictEqual(updated.status, AGENT_STATUSES.RUNNING, 'Estado actualizado');

  // Test 8: Contar agentes
  assert.strictEqual(registry.count(), 1, 'Un agente en el registro');

  // Test 9: Eliminar agente
  const removed = registry.remove('test_agent_1');
  assert.strictEqual(removed, true, 'Agente eliminado');
  assert.strictEqual(registry.get('test_agent_1'), null, 'Agente no encontrado después de eliminar');
  assert.strictEqual(registry.count(), 0, 'Registro vacío después de eliminar');

  // Test output handled by test framework
};

test().catch(() => {
  process.exit(1);
});