const jwt = require('jsonwebtoken');
const AppError = require('../utils/errors');

// Usuarios registrados en el sistema para desarrollo y evaluación
const usuariosMock = [
  {
    id: 1,
    nombre: 'Administrador Principal',
    email: 'admin@lab5.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 2,
    nombre: 'Desarrollador Backend',
    email: 'dev@lab5.com',
    password: 'dev123',
    role: 'developer',
  },
];

class AuthService {
  /**
   * Autentica credenciales y genera un token JWT
   * @param {Object} param0
   * @param {string} param0.email
   * @param {string} param0.password
   */
  async login({ email, password }) {
    const usuario = usuariosMock.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase()
    );

    if (!usuario || usuario.password !== password) {
      throw new AppError(401, 'Credenciales inválidas. Verifica tu correo y contraseña.');
    }

    const secret = process.env.JWT_SECRET || 'supersecreto_lab5_jwt_token_2026_seguro';
    const expiresIn = process.env.JWT_EXPIRES_IN || '2h';

    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.role,
    };

    const token = jwt.sign(payload, secret, { expiresIn });

    return {
      token,
      tipo: 'Bearer',
      expiraEn: expiresIn,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
      },
    };
  }
}

module.exports = new AuthService();
