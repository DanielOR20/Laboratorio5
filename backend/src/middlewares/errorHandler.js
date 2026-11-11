const AppError = require('../utils/errors');

/**
 * Manejador global de errores para Express
 * Captura AppError, errores de servicios externos (OpenAI / DeepSeek) y errores genéricos
 * protegiendo credenciales y datos sensibles.
 */
const errorHandler = (err, req, res, next) => {
  // 1. Errores operacionales controlados mediante AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: 'error',
      message: err.message,
    });
  }

  // 2. Errores específicos de la API externa (DeepSeek / OpenAI APIError o peticiones HTTP)
  if (err.status || err.statusCode) {
    const httpStatus = err.status || err.statusCode;

    // Log interno seguro con fines de depuración sin filtrar a la respuesta HTTP
    console.error(`[API Externa Error ${httpStatus}]:`, err.message);

    if (httpStatus === 401) {
      return res.status(401).json({
        status: 'error',
        message: 'Error de autenticación con el proveedor del servicio LLM. Clave de API no válida o ausente.',
      });
    }

    if (httpStatus === 429) {
      return res.status(429).json({
        status: 'error',
        message: 'El servicio de IA ha alcanzado su límite de tasa de solicitudes o cuota disponible.',
      });
    }

    if (httpStatus === 400) {
      return res.status(400).json({
        status: 'error',
        message: 'Solicitud inválida enviada al proveedor del modelo de lenguaje.',
      });
    }

    if (httpStatus >= 500) {
      return res.status(502).json({
        status: 'error',
        message: 'El servicio externo de IA no se encuentra disponible temporalmente.',
      });
    }

    return res.status(httpStatus).json({
      status: 'error',
      message: 'Ocurrió un error al comunicarse con el servicio externo.',
    });
  }

  // 3. Error no controlado (500)
  console.error('[Error no controlado]:', err);

  return res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
  });
};

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;
