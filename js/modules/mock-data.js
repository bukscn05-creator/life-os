export const mockData = {
  events: [
    { id: 'e1', title: 'Trabajo', date: todayOffset(0), start: '13:00', end: '22:00', category: 'Trabajo', location: '', notes: 'Turno habitual' },
    { id: 'e2', title: 'Compra semanal', date: todayOffset(1), start: '10:30', end: '11:30', category: 'Personal', location: 'Supermercado', notes: '' },
    { id: 'e3', title: 'Llamar a familia', date: todayOffset(2), start: '19:30', end: '20:00', category: 'Familia', location: '', notes: '' }
  ],
  deadlines: [
    { id: 'd1', title: 'Pago alquiler', dueDate: todayOffset(3), amountCents: 65000, category: 'Hogar', completed: false, notes: '' },
    { id: 'd2', title: 'Renovar seguro', dueDate: todayOffset(10), amountCents: 12000, category: 'Seguros', completed: false, notes: '' },
    { id: 'd3', title: 'Declaración trimestral', dueDate: todayOffset(-1), amountCents: null, category: 'Impuestos', completed: false, notes: 'Revisar documentos' }
  ],
  transactions: [
    { id: 't1', date: todayOffset(-1), amountCents: -1250, category: 'Comida', description: 'Almuerzo', type: 'gasto' },
    { id: 't2', date: todayOffset(-2), amountCents: -4500, category: 'Transporte', description: 'Recarga', type: 'gasto' },
    { id: 't3', date: todayOffset(-5), amountCents: 120000, category: 'Ingreso', description: 'Nómina parcial', type: 'ingreso' },
    { id: 't4', date: todayOffset(0), amountCents: -820, category: 'Ocio', description: 'Café', type: 'gasto' }
  ],
  budgets: [
    { id: 'b1', month: currentMonth(), totalCents: 90000, categories: { Comida: 25000, Transporte: 10000, Hogar: 30000, Ocio: 10000, Otros: 15000 } }
  ],
  subscriptions: [
    { id: 's1', name: 'Móvil', amountCents: 1500, period: 'mensual', nextCharge: todayOffset(12), active: true, category: 'Servicios', notes: '' },
    { id: 's2', name: 'Streaming', amountCents: 999, period: 'mensual', nextCharge: todayOffset(20), active: true, category: 'Ocio', notes: '' },
    { id: 's3', name: 'Seguro anual', amountCents: 12000, period: 'anual', nextCharge: todayOffset(10), active: false, category: 'Seguros', notes: 'Pausada temporalmente' }
  ],
  habits: [
    { id: 'h1', name: 'Caminar 20 min', frequency: 'diario', targetPerWeek: 7, active: true },
    { id: 'h2', name: 'Leer', frequency: 'diario', targetPerWeek: 5, active: true },
    { id: 'h3', name: 'Revisar gastos', frequency: 'semanal', targetPerWeek: 1, active: true }
  ],
  habitEntries: buildHabitEntries(),
  healthEntries: [
    { id: 'he1', date: todayOffset(-3), type: 'Peso', value: '78.4', unit: 'kg', notes: '' },
    { id: 'he2', date: todayOffset(-10), type: 'Sueño', value: '7', unit: 'h', notes: 'Descanso aceptable' }
  ],
  appointments: [
    { id: 'a1', title: 'Revisión médica', date: todayOffset(14), time: '09:30', place: 'Centro de salud', notes: 'Llevar resultados' }
  ],
  goals: [
    { id: 'g1', title: 'Ahorrar fondo emergencia', currentCents: 45000, targetCents: 100000, unit: '€', deadline: todayOffset(120), notes: '' },
    { id: 'g2', title: 'Leer libros', current: 3, target: 12, unit: 'libros', deadline: todayOffset(200), notes: '' }
  ],
  people: [
    { id: 'p1', name: 'Mamá', relation: 'Familia', birthday: '1980-05-20', lastContact: todayOffset(-4), notes: 'Llamar el fin de semana' },
    { id: 'p2', name: 'Amigo cercano', relation: 'Amistad', birthday: '1996-11-02', lastContact: todayOffset(-15), notes: '' }
  ],
  savingsPots: [
    { id: 'sp1', name: 'Emergencias', currentCents: 45000, targetCents: 100000, notes: 'Aportación mensual' },
    { id: 'sp2', name: 'Viaje', currentCents: 12000, targetCents: 60000, notes: '' }
  ],
  notes: [
    { id: 'n1', text: 'Revisar suscripciones antes de fin de mes.', date: todayOffset(-1), pinned: true },
    { id: 'n2', text: 'Preparar lista de compra y objetivos de la semana.', date: todayOffset(0), pinned: false }
  ],
  preferences: [
    { id: 'pref', timezone: 'Europe/Berlin', currency: 'EUR', locale: 'es-ES', timelineStart: '07:00', timelineEnd: '23:00', weekFocus: 'Mantener rutina y controlar gastos' }
  ]
};

function todayOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function buildHabitEntries() {
  const entries = [];
  ['h1','h2','h3'].forEach((hid, idx) => {
    for (let i = 0; i < 7; i++) {
      const done = (i + idx) % 3 !== 0;
      if (done) entries.push({ id: `${hid}_d${i}`, habitId: hid, date: todayOffset(-i), done: true });
    }
  });
  return entries;
}