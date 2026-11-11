/**
 * Script de prueba para validar localmente los endpoints de Notas e IA
 * Ejecutar con el servidor activo: node test-client.js
 */
const runTests = async () => {
  const host = 'http://localhost:3000';

  console.log('🚀 Iniciando pruebas locales del API Completa...\n');

  // 1. Listar notas iniciales
  console.log('--- 1. GET /api/notas (Listar todas las notas) ---');
  try {
    const res = await fetch(`${host}/api/notas`);
    const data = await res.json();
    console.log(`Status: ${res.status} | Total notas: ${data.total}`);
  } catch (err) {
    console.error('Error al conectar con el servidor:', err.message);
    return;
  }

  // 2. Crear una nueva nota
  console.log('\n--- 2. POST /api/notas (Crear nueva nota con validación Zod) ---');
  let nuevaNotaId = null;
  try {
    const res = await fetch(`${host}/api/notas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Diseño de Pipeline CI/CD',
        contenido: 'Configurar GitHub Actions con pruebas automatizadas con node:test y despliegue continuo.',
        categoria: 'DevOps',
      }),
    });
    const data = await res.json();
    console.log(`Status: ${res.status} | ID Creado: ${data.datos?.id}`);
    nuevaNotaId = data.datos?.id;
  } catch (err) {
    console.error('Error en POST /api/notas:', err.message);
  }

  // 3. Obtener nota por ID
  if (nuevaNotaId) {
    console.log(`\n--- 3. GET /api/notas/${nuevaNotaId} (Obtener nota por ID) ---`);
    try {
      const res = await fetch(`${host}/api/notas/${nuevaNotaId}`);
      const data = await res.json();
      console.log(`Status: ${res.status} | Título: ${data.datos?.titulo}`);
    } catch (err) {
      console.error(`Error en GET /api/notas/${nuevaNotaId}:`, err.message);
    }
  }

  // 4. Prueba de Validación Fallida (Zod en /api/ia/entidades)
  console.log('\n--- 4. POST /api/ia/entidades (Validación Zod fallida < 10 chars) ---');
  try {
    const res = await fetch(`${host}/api/ia/entidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: 'Corta' }),
    });
    const data = await res.json();
    console.log(`Status: ${res.status} (Esperado 400) | Mensaje: ${data.message}`);
  } catch (err) {
    console.error('Error en validación:', err.message);
  }
};

runTests();
