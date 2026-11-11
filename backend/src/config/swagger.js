const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API REST - Sistema de Notas & Agente DeepSeek IA',
      version: '1.0.0',
      description: `Plataforma backend en Node.js y Express que combina:
1. **Gestión Completa de Notas (CRUD):** Creación, consulta paginada, filtros, actualización y eliminación con validación Zod.
2. **Servicios de Inteligencia Artificial (DeepSeek):** Modelado de bases de datos, diseño de endpoints REST, generación SQL y resúmenes ejecutivos en tiempo real.`,
      contact: {
        name: 'Equipo de Desarrollo Backend',
        url: 'http://localhost:3000',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local de Desarrollo',
      },
    ],
    tags: [
      {
        name: 'Notas',
        description: 'Gestión y operaciones CRUD de notas técnicas',
      },
      {
        name: 'IA',
        description: 'Endpoints de interacción, razonamiento y streaming con DeepSeek',
      },
    ],
    components: {
      schemas: {
        // ==========================================
        // 1. Esquemas para Gestión de Notas
        // ==========================================
        Nota: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            titulo: { type: 'string', example: 'Arquitectura del Sistema Distribuido' },
            contenido: {
              type: 'string',
              example: 'Definir la arquitectura de microservicios utilizando Node.js, Express y bases de datos PostgreSQL...',
            },
            categoria: { type: 'string', example: 'Arquitectura' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-11-01T10:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-11-01T10:00:00.000Z' },
          },
        },
        CrearNotaRequest: {
          type: 'object',
          required: ['titulo', 'contenido'],
          properties: {
            titulo: {
              type: 'string',
              minLength: 3,
              maxLength: 120,
              description: 'Título de la nota',
              example: 'Plan de Refactorización de Controladores',
            },
            contenido: {
              type: 'string',
              minLength: 5,
              maxLength: 5000,
              description: 'Cuerpo de la nota',
              example: 'Migrar controladores monolíticos hacia servicios desacoplados con validación previa de esquemas en Zod.',
            },
            categoria: {
              type: 'string',
              default: 'General',
              description: 'Categoría opcional',
              example: 'Arquitectura',
            },
          },
        },
        ActualizarNotaRequest: {
          type: 'object',
          properties: {
            titulo: { type: 'string', minLength: 3, maxLength: 120, example: 'Nuevo Título de la Nota' },
            contenido: { type: 'string', minLength: 5, maxLength: 5000, example: 'Contenido actualizado...' },
            categoria: { type: 'string', example: 'Infraestructura' },
          },
        },
        ResumenNotaResponse: {
          type: 'object',
          properties: {
            notaId: { type: 'integer', example: 1 },
            titulo: { type: 'string', example: 'Arquitectura del Sistema Distribuido' },
            resumenEjecutivo: {
              type: 'string',
              description: 'Resumen ejecutivo en viñetas generado por DeepSeek.',
              example: '### Resumen Ejecutivo\n- **Base de Datos:** PostgreSQL con transacciones ACID.\n- **Seguridad:** Rate limit y validación Zod.',
            },
            generadoEn: { type: 'string', format: 'date-time', example: '2026-11-11T12:00:00.000Z' },
          },
        },

        // ==========================================
        // 2. Esquemas para Inteligencia Artificial & Agentes
        // ==========================================
        MensajeHistorial: {
          type: 'object',
          required: ['role', 'content'],
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system'],
              description: 'Rol del participante en la conversación',
              example: 'user',
            },
            content: {
              type: 'string',
              description: 'Texto del mensaje previo',
              example: 'Hola agente, necesito diseñar una base de datos.',
            },
          },
        },
        PreguntaIARequest: {
          type: 'object',
          required: ['pregunta'],
          properties: {
            pregunta: {
              type: 'string',
              minLength: 3,
              maxLength: 2000,
              description: 'Pregunta o instrucción para el modelo',
              example: '¿Qué entidades necesito para una base de datos?',
            },
            historial: {
              type: 'array',
              description: 'Historial multi-turno ordenado y sanitizado',
              items: {
                $ref: '#/components/schemas/MensajeHistorial',
              },
              example: [],
            },
          },
        },
        PreguntaAgente: {
          type: 'object',
          required: ['pregunta'],
          properties: {
            pregunta: {
              type: 'string',
              example: '¿Qué entidades necesito para una base de datos?',
            },
            historial: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MensajeHistorial',
              },
              example: [],
            },
          },
        },
        DisenoEntidadesRequest: {
          type: 'object',
          properties: {
            descripcion: {
              type: 'string',
              minLength: 5,
              maxLength: 4000,
              description: 'Contexto o descripción del sistema a modelar',
              example: 'Sistema de comercio electrónico con usuarios, productos, categorías, pedidos y pagos.',
            },
            pregunta: {
              type: 'string',
              minLength: 3,
              maxLength: 4000,
              description: 'Pregunta específica sobre el modelado',
              example: '¿Qué entidades necesito para una base de datos?',
            },
            dialecto: {
              type: 'string',
              enum: ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'SQL Server'],
              default: 'PostgreSQL',
              example: 'PostgreSQL',
            },
            normalizacion: {
              type: 'string',
              enum: ['1FN', '2FN', '3FN', 'Desnormalizado'],
              default: '3FN',
              example: '3FN',
            },
            historial: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MensajeHistorial',
              },
              example: [],
            },
          },
        },
        DisenoEntidadesResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            tarea: { type: 'string', example: 'diseno_entidades' },
            dialecto: { type: 'string', example: 'PostgreSQL' },
            respuesta: {
              type: 'string',
              description: 'Especificación de entidades en Markdown con claves primarias y foráneas.',
            },
          },
        },
        DisenoEndpointsRequest: {
          type: 'object',
          required: ['recursos'],
          properties: {
            recursos: {
              type: 'string',
              minLength: 5,
              maxLength: 3000,
              description: 'Recursos a exponer mediante endpoints REST',
              example: 'Diseña los endpoints REST necesarios para gestionar usuarios, productos, categorías y pedidos con sus operaciones CRUD.',
            },
            estandar: {
              type: 'string',
              enum: ['RESTful JSON', 'JSON:API', 'OpenAPI Estándar'],
              default: 'RESTful JSON',
              example: 'RESTful JSON',
            },
            version: {
              type: 'string',
              default: 'v1',
              example: 'v1',
            },
            historial: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MensajeHistorial',
              },
              example: [],
            },
          },
        },
        DisenoEndpointsResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            tarea: { type: 'string', example: 'diseno_endpoints' },
            version: { type: 'string', example: 'v1' },
            respuesta: {
              type: 'string',
              description: 'Catálogo de endpoints RESTful detallados con verbos y respuestas.',
            },
          },
        },
        GenerarSqlRequest: {
          type: 'object',
          required: ['requerimiento'],
          properties: {
            requerimiento: {
              type: 'string',
              minLength: 10,
              maxLength: 3000,
              example: 'Genera el script SQL en PostgreSQL para crear las tablas de usuarios y pedidos con claves primarias UUID, claves foráneas on delete cascade e índices.',
            },
            motor: {
              type: 'string',
              enum: ['PostgreSQL', 'MySQL', 'SQLite', 'SQL Server', 'Oracle'],
              default: 'PostgreSQL',
              example: 'PostgreSQL',
            },
            tipo: {
              type: 'string',
              enum: ['migracion DDL', 'consulta DML compleja', 'procedimiento almacenado', 'indices y optimizacion'],
              default: 'migracion DDL',
              example: 'migracion DDL',
            },
            historial: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MensajeHistorial',
              },
              example: [],
            },
          },
        },
        GenerarSqlResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            tarea: { type: 'string', example: 'generacion_sql' },
            motor: { type: 'string', example: 'PostgreSQL' },
            tipoOperacion: { type: 'string', example: 'migracion DDL' },
            respuesta: {
              type: 'string',
              description: 'Script SQL listo para ejecutar.',
            },
          },
        },

        // ==========================================
        // 3. Esquemas de Errores
        // ==========================================
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Error de validación en los datos enviados' },
            detalles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  campo: { type: 'string', example: 'titulo' },
                  mensaje: { type: 'string', example: 'El título es obligatorio' },
                },
              },
            },
          },
        },
        RateLimitErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Demasiadas solicitudes al agente de IA. Inténtalo más tarde.',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.js',
    './src/routes/**/*.js',
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/'),
    path.join(__dirname, '../routes/**/*.js').replace(/\\/g, '/'),
  ],
});
