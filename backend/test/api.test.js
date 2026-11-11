const test = require('node:test');
const assert = require('node:assert/strict');
const swaggerSpec = require('../src/config/swagger');
const AppError = require('../src/utils/errors');
const errorHandler = require('../src/middlewares/errorHandler');
const validar = require('../src/middlewares/validar');
const { z } = require('zod');

test('Suite de Pruebas: Especificación Swagger / OpenAPI 3.0', async (t) => {
  await t.test('Debe incluir los endpoints principales de Notas e IA', () => {
    const paths = Object.keys(swaggerSpec.paths || {});
    assert.ok(paths.includes('/api/notas'), 'Falta /api/notas');
    assert.ok(paths.includes('/api/notas/{id}'), 'Falta /api/notas/{id}');
    assert.ok(paths.includes('/api/notas/{id}/resumen'), 'Falta /api/notas/{id}/resumen');
    assert.ok(paths.includes('/api/ia/preguntar'), 'Falta /api/ia/preguntar');
    assert.ok(paths.includes('/api/ia/entidades'), 'Falta /api/ia/entidades');
    assert.ok(paths.includes('/api/ia/endpoints'), 'Falta /api/ia/endpoints');
    assert.ok(paths.includes('/api/ia/stream'), 'Falta /api/ia/stream');
    assert.ok(paths.includes('/api/agent/stream'), 'Falta /api/agent/stream');
    assert.ok(paths.includes('/api/agent/entidades'), 'Falta /api/agent/entidades');
    assert.ok(paths.includes('/api/agent/endpoints'), 'Falta /api/agent/endpoints');
    assert.ok(paths.includes('/api/agent/sql'), 'Falta /api/agent/sql');
    assert.ok(paths.includes('/api/agent/preguntar'), 'Falta /api/agent/preguntar');
  });

  await t.test('Endpoints deben ser públicos y no requerir esquema de seguridad bearerAuth', () => {
    assert.equal(
      swaggerSpec.components?.securitySchemes,
      undefined,
      'No debe existir securitySchemes en Swagger'
    );
    assert.equal(
      swaggerSpec.security,
      undefined,
      'No debe existir directiva global de seguridad en Swagger'
    );
  });

  await t.test('Debe incluir todos los schemas en components.schemas', () => {
    const schemas = Object.keys(swaggerSpec.components?.schemas || {});
    const schemasEsperados = [
      'Nota',
      'CrearNotaRequest',
      'ActualizarNotaRequest',
      'ResumenNotaResponse',
      'DisenoEntidadesRequest',
      'DisenoEntidadesResponse',
      'DisenoEndpointsRequest',
      'DisenoEndpointsResponse',
      'GenerarSqlRequest',
      'GenerarSqlResponse',
      'PreguntaAgente',
      'MensajeHistorial',
      'ErrorResponse',
      'RateLimitErrorResponse',
    ];

    for (const schema of schemasEsperados) {
      assert.ok(schemas.includes(schema), `Falta el esquema: ${schema}`);
    }
  });
});

test('Suite de Pruebas: Validación de Historial Multi-Turno con Zod', async (t) => {
  const mensajeHistorialSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
  });
  const historialSchema = z.array(mensajeHistorialSchema).max(50);

  await t.test('Debe validar correctamente un historial multi-turno ordenado', () => {
    const historialValido = [
      { role: 'user', content: '¿Qué es PostgreSQL?' },
      { role: 'assistant', content: 'Es un motor de base de datos relacional potente y de código abierto.' },
    ];
    const parseado = historialSchema.parse(historialValido);
    assert.equal(parseado.length, 2);
  });

  await t.test('Debe rechazar roles no permitidos en el historial', () => {
    const historialInvalido = [{ role: 'hacker', content: 'Inyección' }];
    const resultado = historialSchema.safeParse(historialInvalido);
    assert.equal(resultado.success, false);
  });
});

test('Suite de Pruebas: Manejo Centralizado de Errores (errorHandler.js)', async (t) => {
  await t.test('Debe responder con status y mensaje propio de AppError', () => {
    const errorApp = new AppError(404, 'Entidad no encontrada');
    let statusCapturado = null;
    let jsonCapturado = null;

    const res = {
      status(code) {
        statusCapturado = code;
        return this;
      },
      json(data) {
        jsonCapturado = data;
      },
    };

    errorHandler(errorApp, {}, res, () => {});

    assert.equal(statusCapturado, 404);
    assert.equal(jsonCapturado.message, 'Entidad no encontrada');
  });

  await t.test('Debe sanitizar y proteger claves ante errores de API externa (401)', () => {
    const errorExterno = { status: 401, message: 'Invalid API Key: sk-secret-1234' };
    let statusCapturado = null;
    let jsonCapturado = null;

    const res = {
      status(code) {
        statusCapturado = code;
        return this;
      },
      json(data) {
        jsonCapturado = data;
      },
    };

    errorHandler(errorExterno, {}, res, () => {});

    assert.equal(statusCapturado, 401);
    assert.equal(
      jsonCapturado.message,
      'Error de autenticación con el proveedor del servicio LLM. Clave de API no válida o ausente.'
    );
    assert.equal(
      jsonCapturado.message.includes('sk-secret'),
      false,
      'No debe exponer datos sensibles en el mensaje'
    );
  });
});
