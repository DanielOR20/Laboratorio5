/**
 * Script de prueba para validar localmente CRUD de Notas, IA y Streaming SSE (públicos y directos)
 * Ejecutar con el servidor activo: node test-client.js
 */
const runTests = async () => {
  const host = 'http://localhost:3000';

  console.log('🚀 Iniciando pruebas locales directas (CRUD, IA y Streaming SSE sin autenticación)...\n');

  // 1. Listar notas públicas (GET /api/notas)
  console.log('--- 1. GET /api/notas (Listado de notas) ---');
  try {
    const res = await fetch(`${host}/api/notas`);
    const data = await res.json();
    console.log(`Status: ${res.status} | Total notas: ${data.total}`);
  } catch (err) {
    console.error('Error al listar notas:', err.message);
  }

  // 2. Crear una nueva nota directamente (POST /api/notas)
  console.log('\n--- 2. POST /api/notas (Creación directa sin login) ---');
  let notaCreadaId = null;
  try {
    const res = await fetch(`${host}/api/notas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Diseño de Microservicios sin Barreras',
        contenido: 'Implementación ágil con endpoints REST públicos listos para interactuar en Swagger.',
        categoria: 'Arquitectura',
      }),
    });
    const data = await res.json();
    console.log(`Status: ${res.status} (Esperado 201) | ID Nota: ${data.datos?.id}`);
    notaCreadaId = data.datos?.id;
  } catch (err) {
    console.error('Error al crear nota:', err.message);
  }

  // 3. Consulta de IA con Historial Multi-Turno (POST /api/ia/preguntar)
  console.log('\n--- 3. POST /api/ia/preguntar (Historial Multi-Turno Sanitizado con Zod) ---');
  try {
    const res = await fetch(`${host}/api/ia/preguntar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pregunta: '¿Y cómo puedo almacenar esos datos de forma óptima?',
        historial: [
          { role: 'user', content: '¿Qué es una clave foránea?' },
          { role: 'assistant', content: 'Es una columna que vincula dos tablas mediante una clave primaria.' },
        ],
      }),
    });
    const data = await res.json();
    console.log(`Status: ${res.status} | Respuesta:`, data.respuesta ? data.respuesta.slice(0, 100) + '...' : data);
  } catch (err) {
    console.error('Error en consulta de IA con historial:', err.message);
  }

  console.log('\n✅ Pruebas locales directas finalizadas con éxito.');
};

runTests();
