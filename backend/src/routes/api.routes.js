const { Router } = require('express');
const { z } = require('zod');
const validar = require('../middlewares/validar');
const { limiterIA } = require('../middlewares/rateLimiter');
const { autenticar } = require('../middlewares/auth');
const notasController = require('../controllers/notas.controller');
const agentController = require('../controllers/agent.controller');

const router = Router();

// ==========================================
// Reto 1: Esquemas de Validación Estricta para Historial Multi-Turno
// ==========================================

const mensajeHistorialSchema = z.object({
  role: z.enum(['user', 'assistant', 'system'], {
    required_error: 'El rol debe ser "user", "assistant" o "system"',
  }),
  content: z
    .string({ required_error: 'El contenido del turno no puede ser nulo' })
    .min(1, 'El contenido no puede estar vacío')
    .max(10000, 'El mensaje supera los 10000 caracteres permitidos'),
});

const historialSchema = z
  .array(mensajeHistorialSchema)
  .max(50, 'El historial no puede superar los 50 turnos de conversación')
  .optional()
  .default([]);

const crearNotaSchema = z.object({
  titulo: z
    .string({ required_error: 'El título es obligatorio' })
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres'),
  contenido: z
    .string({ required_error: 'El contenido es obligatorio' })
    .min(5, 'El contenido debe tener al menos 5 caracteres')
    .max(5000, 'El contenido no puede exceder 5000 caracteres'),
  categoria: z.string().optional().default('General'),
});

const actualizarNotaSchema = z.object({
  titulo: z.string().min(3).max(120).optional(),
  contenido: z.string().min(5).max(5000).optional(),
  categoria: z.string().optional(),
});

const preguntaIASchema = z.object({
  pregunta: z
    .string({ required_error: 'La pregunta es obligatoria' })
    .min(3, 'La pregunta debe tener al menos 3 caracteres')
    .max(2000, 'La pregunta no puede exceder 2000 caracteres'),
  historial: historialSchema,
});

const entidadesIASchema = z
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
    historial: historialSchema,
  })
  .refine((data) => data.descripcion || data.pregunta, {
    message: 'Debes proporcionar al menos el campo "descripcion" o "pregunta"',
    path: ['descripcion'],
  });

const endpointsIASchema = z.object({
  recursos: z
    .string({ required_error: 'Los recursos a exponer son obligatorios' })
    .min(5, 'Especifica al menos un recurso (mínimo 5 caracteres)')
    .max(3000, 'El campo recursos no puede superar los 3000 caracteres'),
  estandar: z
    .enum(['RESTful JSON', 'JSON:API', 'OpenAPI Estándar'])
    .optional()
    .default('RESTful JSON'),
  version: z.string().optional().default('v1'),
  historial: historialSchema,
});

// ============================================================================
// 1. GESTIÓN DE NOTAS (CRUD COMPLETO)
// ============================================================================

/**
 * @openapi
 * /api/notas:
 *   get:
 *     summary: Lista todas las notas registradas
 *     description: Retorna un listado de notas con soporte de búsqueda textual, filtro por categoría y paginación.
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtra notas por categoría exacta
 *         example: Arquitectura
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Búsqueda textual en título o contenido
 *         example: microservicios
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para paginación
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de notas por página
 *     responses:
 *       200:
 *         description: Lista de notas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 pagina:
 *                   type: integer
 *                   example: 1
 *                 limite:
 *                   type: integer
 *                   example: 10
 *                 totalPaginas:
 *                   type: integer
 *                   example: 1
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Nota'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/notas', notasController.listar);

/**
 * @openapi
 * /api/notas:
 *   post:
 *     summary: Crea una nueva nota (Protegido por Bearer Token)
 *     description: Registra una nueva nota en el sistema validando título y contenido mediante Zod.
 *     tags:
 *       - Notas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CrearNotaRequest'
 *           example:
 *             titulo: "Arquitectura del Sistema Distribuido"
 *             contenido: "Definir microservicios con Express, PostgreSQL para transacciones y Redis para caché."
 *             categoria: "Arquitectura"
 *     responses:
 *       201:
 *         description: Nota creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 mensaje:
 *                   type: string
 *                   example: Nota creada exitosamente
 *                 datos:
 *                   $ref: '#/components/schemas/Nota'
 *       400:
 *         description: Datos inválidos enviados en la petición (falla de validación Zod)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado - Token JWT no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/notas', autenticar, validar(crearNotaSchema), notasController.crear);

/**
 * @openapi
 * /api/notas/{id}:
 *   get:
 *     summary: Obtiene una nota específica por su ID
 *     description: Retorna el detalle completo de una nota identificada por su ID numérico.
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numérico de la nota a consultar
 *         example: 1
 *     responses:
 *       200:
 *         description: Nota recuperada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 datos:
 *                   $ref: '#/components/schemas/Nota'
 *       404:
 *         description: Nota no encontrada con el ID proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/notas/:id', notasController.obtenerPorId);

/**
 * @openapi
 * /api/notas/{id}:
 *   put:
 *     summary: Actualiza una nota existente por su ID (Protegido)
 *     description: Modifica el título, contenido o categoría de una nota existente.
 *     tags:
 *       - Notas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la nota a modificar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActualizarNotaRequest'
 *           example:
 *             titulo: "Arquitectura Actualizada del Sistema"
 *             contenido: "Se añade Kafka para mensajería asíncrona entre microservicios."
 *             categoria: "Arquitectura"
 *     responses:
 *       200:
 *         description: Nota actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 mensaje:
 *                   type: string
 *                   example: Nota actualizada exitosamente
 *                 datos:
 *                   $ref: '#/components/schemas/Nota'
 *       400:
 *         description: Datos inválidos enviados en la petición
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Nota no encontrada para actualizar
 *       500:
 *         description: Error interno del servidor
 */
router.put('/notas/:id', autenticar, validar(actualizarNotaSchema), notasController.actualizar);

/**
 * @openapi
 * /api/notas/{id}:
 *   delete:
 *     summary: Elimina una nota por su ID (Protegido)
 *     description: Remueve definitivamente la nota indicada del sistema.
 *     tags:
 *       - Notas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numérico de la nota a eliminar
 *         example: 1
 *     responses:
 *       204:
 *         description: Nota eliminada exitosamente (sin contenido en la respuesta)
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Nota no encontrada para eliminar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/notas/:id', autenticar, notasController.eliminar);

/**
 * @openapi
 * /api/notas/{id}/resumen:
 *   post:
 *     summary: Genera un resumen ejecutivo de la nota mediante DeepSeek (Protegido)
 *     description: Analiza el contenido de la nota y genera una síntesis en viñetas con acciones recomendadas.
 *     tags:
 *       - Notas
 *       - IA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la nota a resumir con IA
 *         example: 1
 *     responses:
 *       200:
 *         description: Resumen ejecutivo generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 datos:
 *                   $ref: '#/components/schemas/ResumenNotaResponse'
 *       400:
 *         description: Parámetro de solicitud inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Nota no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Demasiadas solicitudes al agente de IA (Rate limit excedido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitErrorResponse'
 *       502:
 *         description: Error de comunicación o falla en el proveedor del servicio LLM
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/notas/:id/resumen', autenticar, limiterIA, notasController.generarResumenIA);

// ============================================================================
// 2. ENDPOINTS DE IA / AGENTE DEEPSEEK
// ============================================================================

/**
 * @openapi
 * /api/ia/preguntar:
 *   post:
 *     summary: Envía una pregunta libre al agente inteligente (con Historial multi-turno)
 *     description: Permite formular cualquier consulta de arquitectura o desarrollo manteniendo el contexto ordenado del historial.
 *     tags:
 *       - IA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreguntaIARequest'
 *           example:
 *             pregunta: "¿Qué entidades necesito para una base de datos?"
 *             historial: []
 *     responses:
 *       200:
 *         description: Respuesta generada exitosamente por el modelo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 tarea:
 *                   type: string
 *                   example: consulta_general
 *                 respuesta:
 *                   type: string
 *                   example: Para implementar autenticación segura en Express...
 *       400:
 *         description: Error de validación en la pregunta o historial (Zod)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado - Requiere Bearer Token JWT
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
 *         description: Falla en el servicio de DeepSeek o clave no autorizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/ia/preguntar',
  autenticar,
  limiterIA,
  validar(preguntaIASchema),
  agentController.preguntar
);

/**
 * @openapi
 * /api/ia/entidades:
 *   post:
 *     summary: Diseña entidades y modelo de base de datos normalizado (Protegido)
 *     description: Analiza la descripción y/o pregunta del usuario y genera un modelado de entidades detallado en Markdown.
 *     tags:
 *       - IA
 *     security:
 *       - bearerAuth: []
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
 *         description: Modelo de datos relacional diseñado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DisenoEntidadesResponse'
 *       400:
 *         description: Error de validación en los parámetros de entrada
 *       401:
 *         description: No autorizado
 *       429:
 *         description: Límite de peticiones alcanzado (Rate Limit)
 *       502:
 *         description: El servicio de IA no está disponible o devolvió un error
 */
router.post(
  '/ia/entidades',
  autenticar,
  limiterIA,
  validar(entidadesIASchema),
  agentController.disenarEntidades
);

/**
 * @openapi
 * /api/ia/endpoints:
 *   post:
 *     summary: Propone una lista completa de endpoints REST basados en un requerimiento (Protegido)
 *     description: Diseña la arquitectura de rutas, verbos HTTP, payloads y códigos de estado siguiendo los estándares RESTful.
 *     tags:
 *       - IA
 *     security:
 *       - bearerAuth: []
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
 *         description: Especificación de endpoints generada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DisenoEndpointsResponse'
 *       400:
 *         description: Error de validación en la definición de recursos
 *       401:
 *         description: No autorizado
 *       429:
 *         description: Límite de tasa de solicitudes superado
 *       502:
 *         description: Falla en el proveedor del modelo de lenguaje
 */
router.post(
  '/ia/endpoints',
  autenticar,
  limiterIA,
  validar(endpointsIASchema),
  agentController.disenarEndpoints
);

/**
 * @openapi
 * /api/ia/stream:
 *   post:
 *     summary: Streaming en tiempo real con Server-Sent Events (SSE) (Protegido)
 *     description: Genera respuestas continuas token por token desde DeepSeek mediante eventos de texto en tiempo real.
 *     tags:
 *       - IA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreguntaIARequest'
 *           example:
 *             pregunta: "¿Cómo estructurar una API escalable con microservicios en Express?"
 *             historial: []
 *     responses:
 *       200:
 *         description: Flujo de eventos Server-Sent Events (SSE)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: "data: {\"chunk\":\"Para estructurar\"}\n\ndata: [DONE]\n\n"
 *       400:
 *         description: Error de validación Zod
 *       401:
 *         description: No autorizado
 *       429:
 *         description: Rate limit superado
 *       502:
 *         description: Error en la conexión con DeepSeek
 */
router.post(
  '/ia/stream',
  autenticar,
  limiterIA,
  validar(preguntaIASchema),
  agentController.stream
);

module.exports = router;
