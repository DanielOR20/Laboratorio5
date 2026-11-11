const OpenAI = require('openai');

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy_api_key',
  baseURL: 'https://api.deepseek.com',
});

/**
 * Sanitiza y formatea un mensaje individual asegurando que DeepSeek reciba
 * estrictamente las propiedades esperadas: { role: string, content: string }
 * @param {Object} msg
 * @returns {{ role: 'system'|'user'|'assistant', content: string }}
 */
const formatearMensajeDeepSeek = (msg) => {
  if (!msg) {
    return { role: 'user', content: '' };
  }

  let role = 'user';
  if (['system', 'user', 'assistant'].includes(msg.role)) {
    role = msg.role;
  }

  let content = '';

  // Combinación controlada si vienen campos separados
  if (msg.descripcion && msg.pregunta) {
    content = `Contexto: ${msg.descripcion}. Pregunta: ${msg.pregunta}`;
  } else if (msg.descripcion) {
    content = `Contexto: ${msg.descripcion}`;
  } else if (msg.pregunta) {
    content = `Pregunta: ${msg.pregunta}`;
  } else if (typeof msg.content === 'string') {
    content = msg.content;
  } else if (msg.content && typeof msg.content === 'object') {
    if (msg.content.descripcion && msg.content.pregunta) {
      content = `Contexto: ${msg.content.descripcion}. Pregunta: ${msg.content.pregunta}`;
    } else {
      content = msg.content.descripcion || msg.content.pregunta || JSON.stringify(msg.content);
    }
  } else {
    content = String(msg.content ?? '');
  }

  return {
    role,
    content: String(content).trim(),
  };
};

/**
 * Construye el arreglo ordenado de mensajes para DeepSeek:
 * [System Prompt] -> [Mensajes del Historial multi-turno ordenados] -> [Mensaje actual]
 * @param {Object} params
 * @param {string} [params.system]
 * @param {Array} [params.messages]
 * @returns {Array<{role: string, content: string}>}
 */
const construirPayloadMensajes = ({ system, messages = [] }) => {
  const fullMessages = [];

  if (system) {
    fullMessages.push({
      role: 'system',
      content: typeof system === 'string' ? system : String(system),
    });
  }

  if (Array.isArray(messages)) {
    for (const msg of messages) {
      const limpio = formatearMensajeDeepSeek(msg);
      if (limpio.content) {
        fullMessages.push(limpio);
      }
    }
  }

  return fullMessages;
};

/**
 * Realiza una consulta estándar de chat completions a DeepSeek (no streaming)
 * @param {Object} params
 * @param {string} [params.system]
 * @param {Array<{role: string, content: string}>} [params.messages]
 * @returns {Promise<string>}
 */
const chat = async ({ system, messages = [] }) => {
  const fullMessages = construirPayloadMensajes({ system, messages });

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: fullMessages,
  });

  if (response.usage) {
    console.log('Uso de tokens DeepSeek:', {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    });
  }

  return response.choices[0]?.message?.content || '';
};

/**
 * Inicia una sesión de streaming de respuestas con DeepSeek vía Server-Sent Events
 * @param {Object} params
 * @param {string} [params.system]
 * @param {Array<{role: string, content: string}>} [params.messages]
 * @returns {Promise<AsyncIterable<any>>} Stream asíncrono iterable de OpenAI
 */
const chatStream = async ({ system, messages = [] }) => {
  const fullMessages = construirPayloadMensajes({ system, messages });

  const stream = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: fullMessages,
    stream: true,
  });

  return stream;
};

module.exports = {
  chat,
  chatStream,
  formatearMensajeDeepSeek,
  construirPayloadMensajes,
};
