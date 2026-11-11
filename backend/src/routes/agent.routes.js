const { Router } = require('express');
const { z } = require('zod');
const validar = require('../middlewares/validar');
const { limiterIA } = require('../middlewares/rateLimiter');
const agentController = require('../controllers/agent.controller');

const router = Router();

// ==========================================
// Esquemas de Validación con Zod
// ==========================================

const preguntaAgenteSchema = z.object({
  pregunta: z
    .string({ required_error: 'El campo "pregunta" es obligatorio' })
    .min(3, 'La pregunta debe contener al menos 3 caracteres')
    .max(2000, 'La pregunta no puede superar los 2000 caracteres'),
  historial: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

const entidadesSchema = z
  .object({
    descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres').max(4000).optional(),
    pregunta: z.string().min(3, 'La pregunta debe tener al menos 3 caracteres').max(4000).optional(),
    dialecto: z
      .enum(['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'SQL Server'])
      .optional()
      .default('PostgreSQL'),
    normalizacion: z
      .enum(['1FN', '2FN', '3FN', 'Desnormalizado'])
      .optional()
      .default('3FN'),
    historial: z.array(z.any()).optional().default([]),
  })
  .refine((data) => data.descripcion || data.pregunta, {
    message: 'Debes proporcionar al menos el campo "descripcion" o "pregunta"',
    path: ['descripcion'],
  });

const endpointsSchema = z.object({
  recursos: z
    .string({ required_error: 'El campo "recursos" es obligatorio' })
    .min(5, 'Especifica al menos un recurso o entidad (mínimo 5 caracteres)')
    .max(3000, 'El campo recursos no puede superar los 3000 caracteres'),
  estandar: z
    .enum(['RESTful JSON', 'JSON:API', 'OpenAPI Estándar'])
    .optional()
    .default('RESTful JSON'),
  version: z.string().optional().default('v1'),
  historial: z.array(z.any()).optional().default([]),
});

const sqlSchema = z.object({
  requerimiento: z
    .string({ required_error: 'El campo "requerimiento" es obligatorio' })
    .min(10, 'El requerimiento SQL debe contener al menos 10 caracteres descriptivos')
    .max(3000, 'El requerimiento SQL no puede superar los 3000 caracteres'),
  motor: z
    .enum(['PostgreSQL', 'MySQL', 'SQLite', 'SQL Server', 'Oracle'])
    .optional()
    .default('PostgreSQL'),
  tipo: z
    .enum(['migracion DDL', 'consulta DML compleja', 'procedimiento almacenado', 'indices y optimizacion'])
    .optional()
    .default('migracion DDL'),
  historial: z.array(z.any()).optional().default([]),
});

// ==========================================
// 1. Endpoint: Diseño de Entidades
// ==========================================

/**
 * @openapi
 * /api/agent/entidades:
 *   post:
 *     summary: Diseña entidades y modelo de base de datos normalizado
 *     description: Analiza la descripción del sistema y genera el modelo relacional detallado con PKs, FKs y restricciones.
 *     tags:
 *       - IA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisenoEntidadesRequest'
 *           example:
 *             descripcion: "Sistema de comercio electrónico con usuarios, productos, categorías, pedidos y pagos."
 *             pregunta: "¿Qué entidades necesito para una base de datos?"
 *             dialecto: "PostgreSQL"
 *             normalizacion: "3FN"
 *             historial: []
 *     responses:
 *       200:
 *         description: Modelo de base de datos diseñado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DisenoEntidadesResponse'
 *       400:
 *         description: Error de validación en los datos de la petición (Zod)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Límite de tasa de solicitudes superado (Rate Limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitErrorResponse'
 *       502:
 *         description: Falla en el servicio de IA o API externa no disponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/entidades',
  limiterIA,
  validar(entidadesSchema),
  agentController.disenarEntidades
);

// ==========================================
// 2. Endpoint: Diseño de Endpoints REST
// ==========================================

/**
 * @openapi
 * /api/agent/endpoints:
 *   post:
 *     summary: Diseña la arquitectura y especificación de endpoints RESTful
 *     description: Genera rutas, verbos HTTP (GET, POST, PUT, DELETE), contratos JSON y códigos de estado.
 *     tags:
 *       - IA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisenoEndpointsRequest'
 *           example:
 *             recursos: "Diseña los endpoints REST necesarios para gestionar usuarios, productos, categorías y pedidos con sus operaciones CRUD."
 *             estandar: "RESTful JSON"
 *             version: "v1"
 *             historial: []
 *     responses:
 *       200:
 *         description: Especificación de endpoints generada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DisenoEndpointsResponse'
 *       400:
 *         description: Error de validación en los parámetros de entrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Límite de tasa de solicitudes superado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitErrorResponse'
 *       502:
 *         description: Error interno o falla al comunicarse con el modelo de lenguaje
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/endpoints',
  limiterIA,
  validar(endpointsSchema),
  agentController.disenarEndpoints
);

// ==========================================
// 3. Endpoint: Generación de Código y Migraciones SQL
// ==========================================

/**
 * @openapi
 * /api/agent/sql:
 *   post:
 *     summary: Genera scripts SQL profesionales, migraciones DDL o consultas complejas
 *     description: Produce código SQL transaccional optimizado para el motor seleccionado.
 *     tags:
 *       - IA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerarSqlRequest'
 *           example:
 *             requerimiento: "Genera el script SQL en PostgreSQL para crear las tablas de usuarios y pedidos con claves primarias UUID, claves foráneas on delete cascade e índices."
 *             motor: "PostgreSQL"
 *             tipo: "migracion DDL"
 *             historial: []
 *     responses:
 *       200:
 *         description: Script SQL generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerarSqlResponse'
 *       400:
 *         description: Error de validación en el requerimiento SQL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Límite de solicitudes alcanzado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitErrorResponse'
 *       502:
 *         description: Error al comunicarse con el servicio LLM
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/sql',
  limiterIA,
  validar(sqlSchema),
  agentController.generarSql
);

// ==========================================
// Endpoint General (Retrocompatibilidad)
// ==========================================

/**
 * @openapi
 * /api/agent/preguntar:
 *   post:
 *     summary: Consulta general al agente asistencial
 *     description: Permite realizar preguntas abiertas de desarrollo y arquitectura de software.
 *     tags:
 *       - IA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreguntaAgente'
 *           example:
 *             pregunta: "¿Qué entidades necesito para una base de datos?"
 *             historial: []
 *     responses:
 *       200:
 *         description: Respuesta exitosa generada por el agente
 *       400:
 *         description: Error de validación
 *       429:
 *         description: Límite de tasa excedido
 *       502:
 *         description: Error de comunicación con DeepSeek
 */
router.post(
  '/preguntar',
  limiterIA,
  validar(preguntaAgenteSchema),
  agentController.preguntar
);

module.exports = router;
