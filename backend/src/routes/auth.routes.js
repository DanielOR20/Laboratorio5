const { Router } = require('express');
const { z } = require('zod');
const validar = require('../middlewares/validar');
const { autenticar } = require('../middlewares/auth');
const authController = require('../controllers/auth.controller');

const router = Router();

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .email('Formato de correo electrónico inválido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión de desarrollador y genera un Bearer Token (JWT)
 *     description: Valida credenciales predefinidas y retorna un token JWT válido para autorizar las solicitudes en Swagger y endpoints protegidos.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "admin@lab5.com"
 *             password: "admin123"
 *     responses:
 *       200:
 *         description: Autenticación exitosa y generación del token JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Error de validación en email o contraseña (Zod)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validar(loginSchema), authController.login);

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     summary: Obtiene el perfil y datos del token decodificado
 *     description: Endpoint de prueba protegido por Bearer Token.
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil recuperado con éxito
 *       401:
 *         description: Token no provisto, inválido o expirado
 */
router.get('/perfil', autenticar, authController.perfil);

module.exports = router;
