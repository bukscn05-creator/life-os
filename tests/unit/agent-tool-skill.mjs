// Tests unitarios para AGENTIC OS - ToolRegistry y SkillRegistry
import assert from 'node:assert/strict';
import { ToolRegistry, ToolDefinition } from '../../js/agents/tool-types.js';
import { SkillRegistry, SkillDefinition } from '../../js/agents/skill-types.js';

const test = async () => {
  // ========== Test ToolRegistry ==========
  const toolRegistry = new ToolRegistry();

  // Test 1: Registrar herramienta
  const toolDef = new ToolDefinition({
    name: 'test_tool',
    displayName: 'Herramienta de Prueba',
    description: 'Herramienta para pruebas',
    category: 'test',
    parameters: [
      { name: 'input', type: 'string', required: true }
    ],
    returns: { result: 'string' }
  });

  toolRegistry.register(toolDef);
  assert.ok(toolRegistry.get('test_tool'), 'Herramienta registrada');

  // Test 2: Obtener herramienta
  const tool = toolRegistry.get('test_tool');
  assert.strictEqual(tool.name, 'test_tool', 'Nombre de herramienta correcto');
  assert.strictEqual(tool.category, 'test', 'Categoría correcta');

  // Test 3: Buscar herramientas
  const tools = toolRegistry.find(t => t.category === 'test');
  assert.strictEqual(tools.length, 1, 'Una herramienta de categoría test');

  // Test 4: Asignar herramienta a agente
  toolRegistry.assignToolToAgent('agent_1', 'test_tool');
  const agentTools = toolRegistry.getToolsForAgent('agent_1');
  assert.strictEqual(agentTools.length, 1, 'Agente tiene la herramienta');

  // Test 5: Validar uso de herramienta
  const canUse = await toolRegistry.validateToolUsage('agent_1', 'test_tool');
  assert.strictEqual(canUse, true, 'Agente puede usar la herramienta');

  // Test 6: Validar entrada de herramienta
  toolDef.validate({ input: 'texto de prueba' });
  assert.throws(() => toolDef.validate({}), Error, 'Lanza error si falta parámetro requerido');

  // Test 7: Contar herramientas
  assert.strictEqual(toolRegistry.count(), 1, 'Una herramienta registrada');

  // ========== Test SkillRegistry ==========
  const skillRegistry = new SkillRegistry();

  // Test 8: Registrar skill
  const skillDef = new SkillDefinition({
    name: 'test_skill',
    displayName: 'Skill de Prueba',
    description: 'Skill para pruebas',
    category: 'test',
    requiredTools: ['test_tool'],
    complexity: 'simple',
    estimatedTime: 100
  });

  skillRegistry.register(skillDef);
  assert.ok(skillRegistry.get('test_skill'), 'Skill registrada');

  // Test 9: Obtener skill
  const skill = skillRegistry.get('test_skill');
  assert.strictEqual(skill.name, 'test_skill', 'Nombre de skill correcto');
  assert.strictEqual(skill.complexity, 'simple', 'Complejidad correcta');

  // Test 10: Asignar skill a agente
  skillRegistry.assignSkillToAgent('agent_1', 'test_skill');
  const agentSkills = skillRegistry.getSkillsForAgent('agent_1');
  assert.strictEqual(agentSkills.length, 1, 'Agente tiene la skill');

  // Test 11: Validar uso de skill
  const canUseSkill = await skillRegistry.validateSkillUsage('agent_1', 'test_skill');
  assert.strictEqual(canUseSkill, true, 'Agente puede usar la skill');

  // Test 12: Contar skills
  assert.strictEqual(skillRegistry.count(), 1, 'Una skill registrada');

  // Test output handled by test framework
};

test().catch(() => {
  process.exit(1);
});