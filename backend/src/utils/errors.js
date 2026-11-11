/**
 * Clase personalizada de error que extiende de Error
 * @param {number} status - Código de estado HTTP
 * @param {string} message - Mensaje descriptivo del error
 */
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.statusCode = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
module.exports.AppError = AppError;
