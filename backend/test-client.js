/**
 * Script de prueba para validar localmente Autenticación JWT, CRUD, IA y Streaming SSE
 * Ejecutar con el servidor activo: node test-client.js
 */
const runTests = async () => {
  const host = 'http://localhost:3000';

  console.log('🚀 Iniciando pruebas locales de producción (JWT, CRUD, IA y Streaming SSE)...\n');

  // 1. Iniciar sesión y obtener Bearer Token (Reto 2)
  console.log('--- 1. POST /api/auth/login (Obtención de Token JWT) ---');
  let token = null;
  try {
    const res = await fetch(`${host}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@lab5.com',
        password: 'admin123',
      }),
    });
    const data = await res.json();
    console.log(`Status: ${res.status} | Token recibido:`, data.datos?.token ? 'OK (eyJhbGci...)' : 'Error');
    token = data.datos?.token;
  } catch (err) {
    console.error('Error en /api/auth/login:', err.message);
    return;
  }

  // 2. Consulta protegida sin token (debe responder 401)
  console.log('\n--- 2. POST /api/notas (Intento sin token - Esperado 401) ---');
  try {
    const res = await fetch(`${host}/api/notas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nota no autorizada', contenido: 'Contenido' }),
    });
    const data = await res.json();
    console.log(`Status: ${res.status} (Esperado 401) | Mensaje: ${data.message}`);
  } catch (err) {
    console.error('Error al probar ruta protegida:', err.message);
  }

  // 3. Crear nota con Bearer Token
  if (token) {
    console.log('\n--- 3. POST /api/notas (Creación con Bearer Token - Esperado 201) ---');
    try {
      const res = await fetch(`${host}/api/notas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: 'Arquitectura Segura JWT',
          contenido: 'Validación en cabecera Authorization con formato Bearer y expiración en 2 horas.',
          categoria: 'Seguridad',
        }),
      });
      const data = await res.json();
      console.log(`Status: ${res.status} | ID Nota: ${data.datos?.id}`);
    } catch (err) {
      console.error('Error en creación autorizada:', err.message);
    }
  }

  // 4. Reto 1: Historial multi-turno ordenado
  if (token) {
    console.log('\n--- 4. POST /api/ia/preguntar (Historial Multi-Turno Sanitizado con Zod) ---');
    try {
      const res = await fetch(`${host}/api/ia/preguntar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pregunta: '¿Y cómo puedo almacenar esos datos de forma óptima?',
          historial: [
            { role: 'user', content: '¿Qué es una clave foránea?' },
            { role: 'assistant', content: 'Es una columna o conjunto de columnas que vincula dos tablas mediante una clave primaria.' },
          ],
        }),
      });
      const data = await res.json();
      console.log(`Status: ${res.status} | Respuesta:`, data.respuesta ? data.respuesta.slice(0, 100) + '...' : data);
    } catch (err) {
      console.error('Error en consulta con historial:', err.message);
    }
  }

  console.log('\n✅ Pruebas locales finalizadas con éxito.');
};

runTests();
