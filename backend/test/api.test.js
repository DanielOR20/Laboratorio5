const test = require('node:test');
const assert = require('node:assert/strict');
const swaggerSpec = require('../src/config/swagger');
const AppError = require('../src/utils/errors');
const errorHandler = require('../src/middlewares/errorHandler');
const validar = require('../src/middlewares/validar');
const { z } = require('zod');

test('Suite de Pruebas: Especificación Swagger / OpenAPI 3.0', async (t) => {
  await t.test('Debe incluir los 4 endpoints principales de la API', () => {
    const paths = Object.keys(swaggerSpec.paths || {});
    assert.ok(paths.includes('/api/agent/entidades'), 'Falta /api/agent/entidades');
    assert.ok(paths.includes('/api/agent/endpoints'), 'Falta /api/agent/endpoints');
    assert.ok(paths.includes('/api/agent/sql'), 'Falta /api/agent/sql');
    assert.ok(paths.includes('/api/agent/preguntar'), 'Falta /api/agent/preguntar');
  });

  await t.test('Debe incluir todos los schemas en components.schemas', () => {
    const schemas = Object.keys(swaggerSpec.components?.schemas || {});
    const schemasEsperados = [
      'DisenoEntidadesRequest',
      'DisenoEntidadesResponse',
      'DisenoEndpointsRequest',
      'DisenoEndpointsResponse',
      'GenerarSqlRequest',
      'GenerarSqlResponse',
      'PreguntaAgente',
      'ErrorResponse',
      'RateLimitErrorResponse',
    ];

    for (const schema of schemasEsperados) {
      assert.ok(schemas.includes(schema), `Falta el esquema: ${schema}`);
    }
  });
});

test('Suite de Pruebas: Middleware de Validación Zod (validar.js)', async (t) => {
  const schemaPrueba = z.object({
    campoObligatorio: z.string().min(5, 'Mínimo 5 caracteres'),
  });

  await t.test('Debe rechazar peticiones con datos incompletos con código 400', () => {
    const req = { body: { campoObligatorio: 'abc' } }; // < 5 caracteres
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

    let nextLlamado = false;
    const middleware = validar(schemaPrueba);
    middleware(req, res, () => {
      nextLlamado = true;
    });

    assert.equal(nextLlamado, false, 'No debió llamar a next() con datos inválidos');
    assert.equal(statusCapturado, 400, 'El status debió ser 400');
    assert.equal(jsonCapturado.status, 'error');
    assert.ok(jsonCapturado.detalles.length > 0, 'Debe incluir la lista de detalles');
  });

  await t.test('Debe procesar y llamar a next() con datos válidos', () => {
    const req = { body: { campoObligatorio: 'Texto Valido' } };
    let nextLlamado = false;

    const middleware = validar(schemaPrueba);
    middleware(req, {}, () => {
      nextLlamado = true;
    });

    assert.equal(nextLlamado, true, 'Debió llamar a next() con datos válidos');
    assert.equal(req.body.campoObligatorio, 'Texto Valido');
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
