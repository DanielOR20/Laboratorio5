const authService = require('../services/auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const resultado = await authService.login({ email, password });
      return res.status(200).json({
        status: 'success',
        mensaje: 'Autenticación exitosa',
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  async perfil(req, res, next) {
    try {
      return res.status(200).json({
        status: 'success',
        usuario: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
