const agentService = require('../services/agent.service');

/**
 * Controlador para atender peticiones generales o por especialidad al agente
 */
const preguntar = async (req, res, next) => {
  try {
    const { pregunta, historial = [] } = req.body;
    const respuesta = await agentService.dbAgent(pregunta, historial);

    return res.status(200).json({
      status: 'success',
      tarea: 'consulta_general',
      respuesta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint especializado en diseñar entidades de base de datos
 */
const disenarEntidades = async (req, res, next) => {
  try {
    const { descripcion, pregunta, dialecto, normalizacion, historial = [] } = req.body;
    const respuesta = await agentService.disenarEntidades({
      descripcion,
      pregunta,
      dialecto,
      normalizacion,
      historial,
    });

    return res.status(200).json({
      status: 'success',
      tarea: 'diseno_entidades',
      dialecto: dialecto || 'PostgreSQL',
      respuesta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint especializado en diseñar especificaciones de endpoints REST
 */
const disenarEndpoints = async (req, res, next) => {
  try {
    const { recursos, estandar, version, historial = [] } = req.body;
    const respuesta = await agentService.disenarEndpoints({
      recursos,
      estandar,
      version,
      historial,
    });

    return res.status(200).json({
      status: 'success',
      tarea: 'diseno_endpoints',
      version: version || 'v1',
      respuesta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint especializado en generar scripts SQL o migraciones DDL/DML
 */
const generarSql = async (req, res, next) => {
  try {
    const { requerimiento, motor, tipo, historial = [] } = req.body;
    const respuesta = await agentService.generarSql({
      requerimiento,
      motor,
      tipo,
      historial,
    });

    return res.status(200).json({
      status: 'success',
      tarea: 'generacion_sql',
      motor: motor || 'PostgreSQL',
      tipoOperacion: tipo || 'migracion DDL',
      respuesta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reto 3: Streaming de respuestas en tiempo real mediante Server-Sent Events (SSE)
 */
const stream = async (req, res, next) => {
  const { pregunta, historial = [] } = req.body;

  // Configuración de encabezados obligatorios para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const streamRespuesta = await agentService.iniciarStream({ pregunta, historial });

    for await (const chunk of streamRespuesta) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        res.write(`data: ${JSON.stringify({ chunk: delta })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[Error durante Streaming SSE]:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Falla al procesar el stream con el modelo' })}\n\n`);
    res.end();
  }
};

module.exports = {
  preguntar,
  disenarEntidades,
  disenarEndpoints,
  generarSql,
  stream,
};
