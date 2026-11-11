const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const apiRoutes = require('./routes/api.routes');
const agentRoutes = require('./routes/agent.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Seguridad de cabeceras HTTP y habilitación de CORS
app.use(
  helmet({
    contentSecurityPolicy: false, // Permite que Swagger UI renderice assets locales sin bloqueos
  })
);
app.use(cors());

// Middlewares para procesar body en formato JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Interfaz visual interactiva de Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Endpoint auxiliar para obtener el JSON crudo de OpenAPI
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rutas principales de la API (CRUD de Notas + Agente DeepSeek)
app.use('/api', apiRoutes);

// Rutas complementarias del agente especializado (retrocompatibilidad)
app.use('/api/agent', agentRoutes);

// Manejador global centralizado de errores
app.use(errorHandler);

module.exports = app;
