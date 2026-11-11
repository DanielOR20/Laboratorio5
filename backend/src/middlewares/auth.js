const jwt = require('jsonwebtoken');

/**
 * Middleware para validar tokens Bearer JWT
 */
const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Token de autenticación no proporcionado. Formato requerido: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'supersecreto_lab5_jwt_token_2026_seguro';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'El token de autenticación ha expirado. Por favor inicia sesión nuevamente.',
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Token de autenticación inválido o alterado.',
    });
  }
};

/**
 * Middleware opcional para restringir acceso por roles
 * @param  {...string} rolesPermitidos
 */
const requerirRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Acceso denegado: no cuentas con los permisos suficientes para esta operación.',
      });
    }
    next();
  };
};

module.exports = {
  autenticar,
  requerirRol,
};
