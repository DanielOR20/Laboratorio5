const { chat, chatStream } = require('./llm.service');

/**
 * Fábrica de agentes que encapsula un prompt del sistema e inyecta ordenadamente
 * el historial multi-turno antes del mensaje del usuario.
 * @param {string} system - Prompt del sistema para definir la personalidad o especialidad del agente
 * @returns {Function} Función asíncrona (input, historial) => Promise<string>
 */
const createAgent = (system) => {
  return async (input, historial = []) => {
    let contentString = '';

    if (typeof input === 'string') {
      contentString = input;
    } else if (input && typeof input === 'object') {
      const desc = input.descripcion || '';
      const preg = input.pregunta || '';
      if (desc && preg) {
        contentString = `Contexto: ${desc}. Pregunta: ${preg}`;
      } else {
        contentString = desc || preg || JSON.stringify(input);
      }
    } else {
      contentString = String(input || '');
    }

    // Reto 1: Inyección limpia, ordenada y tipada del historial multi-turno
    const mensajesOrdenados = [];

    if (Array.isArray(historial)) {
      for (const turno of historial) {
        if (turno && turno.role && turno.content) {
          mensajesOrdenados.push({
            role: turno.role,
            content: String(turno.content).trim(),
          });
        }
      }
    }

    // Se anexa el mensaje actual al final del historial
    mensajesOrdenados.push({
      role: 'user',
      content: contentString.trim(),
    });

    const respuesta = await chat({
      system,
      messages: mensajesOrdenados,
    });

    return respuesta;
  };
};

/**
 * Reto 3: Fábrica para streaming progresivo de respuestas
 * @param {string} system
 */
const createStreamAgent = (system) => {
  return async (input, historial = []) => {
    let contentString = typeof input === 'string' ? input : JSON.stringify(input);

    const mensajesOrdenados = [];

    if (Array.isArray(historial)) {
      for (const turno of historial) {
        if (turno && turno.role && turno.content) {
          mensajesOrdenados.push({
            role: turno.role,
            content: String(turno.content).trim(),
          });
        }
      }
    }

    mensajesOrdenados.push({
      role: 'user',
      content: contentString.trim(),
    });

    return await chatStream({
      system,
      messages: mensajesOrdenados,
    });
  };
};

// ==========================================
// 1. Agente Especializado: Diseño de Entidades y Modelado de BD
// ==========================================
const entidadesSystemPrompt = `Eres un Arquitecto de Datos Principal especializado en modelado de bases de datos relacionales y NoSQL.
Tu objetivo es analizar los requisitos del negocio y generar un diseño de entidades exhaustivo, formal y normalizado (hasta 3FN cuando aplique).
Para cada entidad debes detallar:
- Nombre de la tabla/colección (en singular o plural consistente).
- Campos con sus tipos de datos precisos, restricciones (NOT NULL, UNIQUE, DEFAULT, CHECK).
- Clave Primaria (PK) y Claves Foráneas (FK).
- Relaciones explícitas (1:1, 1:N, N:M) y tablas intermedias requeridas.
- Índices recomendados para optimizar consultas frecuentes.
- Breve justificación de las decisiones de diseño.
Utiliza formato Markdown claro con tablas para los campos y diagramas de texto o notación tipo Crow's Foot.`;

const entidadesAgent = createAgent(entidadesSystemPrompt);

// ==========================================
// 2. Agente Especializado: Diseño de Endpoints RESTful
// ==========================================
const endpointsSystemPrompt = `Eres un Arquitecto de APIs RESTful y Líder Backend con dominio estricto del Modelo de Madurez de Richardson (Nivel 2 y 3).
Tu objetivo es diseñar una especificación completa de endpoints REST basados en recursos para las entidades solicitadas.
Para cada recurso debes definir:
- Ruta con nomenclatura estándar (sustantivos en plural, ej: /api/v1/usuarios/:id/pedidos).
- Verbo HTTP correspondiente (GET, POST, PUT, PATCH, DELETE).
- Resumen y descripción del caso de uso.
- Parámetros de ruta (Path Params), parámetros de consulta (Query Params: paginación, filtros, ordenamiento) y Headers necesarios.
- Ejemplo de Request Body en JSON (si aplica).
- Respuestas esperadas con códigos de estado HTTP precisos (200, 201, 204, 400, 401, 403, 404, 409, 422, 500) y esquemas JSON de respuesta.
- Reglas de negocio y consideraciones de seguridad asociadas.`;

const endpointsAgent = createAgent(endpointsSystemPrompt);

// ==========================================
// 3. Agente Especializado: Generación de Código y Migraciones SQL
// ==========================================
const sqlSystemPrompt = `Eres un Administrador de Bases de Datos (DBA) senior y Especialista en SQL de alto rendimiento.
Tu objetivo es escribir scripts SQL limpios, seguros, listos para producción y optimizados para el motor solicitado (PostgreSQL, MySQL, SQLite, etc.).
Debes incluir:
- Manejo transaccional seguro (BEGIN TRANSACTION / COMMIT / ROLLBACK si aplica).
- Sentencias DDL precisas: CREATE TABLE IF NOT EXISTS con tipos de datos nativos adecuados (UUID, TIMESTAMP WITH TIME ZONE, JSONB, DECIMAL, etc.).
- Claves foráneas con directivas de integridad referencial (ON DELETE / ON UPDATE).
- Creación de índices estratégicos (CREATE INDEX) para claves foráneas y campos de búsqueda.
- Comentarios de documentación en el código SQL.
- Si se solicitan consultas DML o reportes: utiliza buenas prácticas, CTEs (WITH), JOINs explícitos y funciones de agregación o ventana eficientes.`;

const sqlAgent = createAgent(sqlSystemPrompt);

// ==========================================
// Agente Generalista & Streaming
// ==========================================
const dbAgentSystemPrompt = `Eres un arquitecto de software y analista de datos experto.
Tu especialidad es diseñar modelos de datos (relacionales y NoSQL), definir entidades, atributos, claves primarias y foráneas, relaciones (1:1, 1:N, N:M), y diseñar endpoints RESTful limpios y escalables con sus verbos HTTP, códigos de estado y contratos de datos correspondientes.`;

const dbAgent = createAgent(dbAgentSystemPrompt);
const streamAgent = createStreamAgent(dbAgentSystemPrompt);

module.exports = {
  createAgent,
  createStreamAgent,
  dbAgent,
  streamAgent,
  entidadesAgent,
  endpointsAgent,
  sqlAgent,

  disenarEntidades: async ({ descripcion = '', pregunta = '', dialecto = 'PostgreSQL', normalizacion = '3FN', historial = [] }) => {
    let promptUsuario = '';

    if (descripcion && pregunta) {
      promptUsuario = `Contexto: ${descripcion}. Pregunta: ${pregunta}`;
    } else if (descripcion) {
      promptUsuario = `Contexto: ${descripcion}. Pregunta: Diseña las entidades y el modelo de datos detallado.`;
    } else if (pregunta) {
      promptUsuario = `Pregunta: ${pregunta}`;
    } else {
      promptUsuario = 'Diseña las entidades y el modelo de datos normalizado para el sistema.';
    }

    if (dialecto || normalizacion) {
      promptUsuario += `\n(Preferencias técnicas: Motor: ${dialecto}, Normalización: ${normalizacion})`;
    }

    return entidadesAgent(promptUsuario, historial);
  },

  disenarEndpoints: async ({ recursos = '', requerimiento = '', estandar = 'RESTful JSON', version = 'v1', historial = [] }) => {
    const objetivo = recursos || requerimiento || 'las entidades principales del sistema';
    const promptUsuario = `Diseña la arquitectura de endpoints REST para los siguientes recursos o entidades: ${objetivo}.\n(Estándar: ${estandar}, Versión: ${version})`;
    return endpointsAgent(promptUsuario, historial);
  },

  generarSql: async ({ requerimiento = '', motor = 'PostgreSQL', tipo = 'migracion DDL', historial = [] }) => {
    const promptUsuario = `Genera el script SQL para el siguiente caso:\n- Requerimiento: ${requerimiento}\n- Motor: ${motor}\n- Tipo de operación: ${tipo}`;
    return sqlAgent(promptUsuario, historial);
  },

  /**
   * Genera el stream en tiempo real con historial inyectado
   */
  iniciarStream: async ({ pregunta, historial = [] }) => {
    return streamAgent(pregunta, historial);
  },
};
