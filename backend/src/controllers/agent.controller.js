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

module.exports = {
  preguntar,
  disenarEntidades,
  disenarEndpoints,
  generarSql,
};
