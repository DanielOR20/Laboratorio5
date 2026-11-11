const test = require('node:test');
const assert = require('node:assert/strict');
const swaggerSpec = require('../src/config/swagger');
const AppError = require('../src/utils/errors');
const errorHandler = require('../src/middlewares/errorHandler');
const validar = require('../src/middlewares/validar');
const { autenticar } = require('../src/middlewares/auth');
const authService = require('../src/services/auth.service');
const { z } = require('zod');

test('Suite de Pruebas: Especificación Swagger / OpenAPI 3.0', async (t) => {
  await t.test('Debe incluir los endpoints principales y de autenticación', () => {
    const paths = Object.keys(swaggerSpec.paths || {});
    assert.ok(paths.includes('/api/auth/login'), 'Falta /api/auth/login');
    assert.ok(paths.includes('/api/agent/stream'), 'Falta /api/agent/stream');
    assert.ok(paths.includes('/api/agent/entidades'), 'Falta /api/agent/entidades');
    assert.ok(paths.includes('/api/agent/endpoints'), 'Falta /api/agent/endpoints');
    assert.ok(paths.includes('/api/agent/sql'), 'Falta /api/agent/sql');
    assert.ok(paths.includes('/api/agent/preguntar'), 'Falta /api/agent/preguntar');
  });

  await t.test('Debe registrar el esquema de seguridad bearerAuth para JWT', () => {
    assert.ok(
      swaggerSpec.components?.securitySchemes?.bearerAuth,
      'Falta el esquema de seguridad bearerAuth en Swagger'
    );
    assert.equal(swaggerSpec.components.securitySchemes.bearerAuth.scheme, 'bearer');
    assert.equal(swaggerSpec.components.securitySchemes.bearerAuth.bearerFormat, 'JWT');
  });

  await t.test('Debe incluir todos los schemas en components.schemas', () => {
    const schemas = Object.keys(swaggerSpec.components?.schemas || {});
    const schemasEsperados = [
      'LoginRequest',
      'LoginResponse',
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

test('Suite de Pruebas: Reto 2 - Autenticación JWT y Middleware auth.js', async (t) => {
  let tokenGenerado = null;

  await t.test('Debe autenticar credenciales válidas y devolver un JWT', async () => {
    const resultado = await authService.login({
      email: 'admin@lab5.com',
      password: 'admin123',
    });

    assert.ok(resultado.token, 'Debe devolver la propiedad token');
    assert.equal(resultado.tipo, 'Bearer');
    assert.equal(resultado.usuario.email, 'admin@lab5.com');
    tokenGenerado = resultado.token;
  });

  await t.test('Debe rechazar credenciales incorrectas con 401', async () => {
    await assert.rejects(
      async () => {
        await authService.login({
          email: 'admin@lab5.com',
          password: 'password_erronea',
        });
      },
      (err) => {
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  await t.test('Middleware autenticar debe rechazar peticiones sin token con código 401', () => {
    const req = { headers: {} };
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

    autenticar(req, res, () => {});
    assert.equal(statusCapturado, 401);
    assert.equal(jsonCapturado.status, 'error');
  });

  await t.test('Middleware autenticar debe aceptar un Bearer Token válido', () => {
    const req = { headers: { authorization: `Bearer ${tokenGenerado}` } };
    let nextLlamado = false;

    autenticar(req, {}, () => {
      nextLlamado = true;
    });

    assert.equal(nextLlamado, true, 'Debió permitir el paso');
    assert.equal(req.user.email, 'admin@lab5.com');
  });
});

test('Suite de Pruebas: Reto 1 - Validación de Historial Multi-Turno con Zod', async (t) => {
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
