/**
 * Middleware genérico para validar el cuerpo de la petición con un esquema de Zod
 * @param {import('zod').ZodSchema} schema
 */
const validar = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      return res.status(400).json({
        status: 'error',
        message: 'Error de validación en los datos enviados',
        detalles: issues.map((err) => ({
          campo: err.path.join('.'),
          mensaje: err.message,
        })),
      });
    }

    // Almacena los datos analizados y limpios en req.body
    req.body = result.data;
    next();
  };
};

module.exports = validar;
module.exports.validar = validar;
