const rateLimit = require('express-rate-limit');

/**
 * Limitador de tasa de peticiones para endpoints del agente de IA
 * Ventana: 15 minutos
 * Máximo: 20 peticiones por IP
 */
const limiterIA = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo 20 peticiones por ventana
  standardHeaders: true, // Retorna encabezados `RateLimit-*` (RFC draft-6/draft-7)
  legacyHeaders: false, // Deshabilita encabezados `X-RateLimit-*`
  message: {
    error: 'Demasiadas solicitudes al agente de IA. Inténtalo más tarde.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  limiterIA,
};

