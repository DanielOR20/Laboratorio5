const OpenAI = require('openai');

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'dummy_api_key',
  baseURL: 'https://api.deepseek.com',
});

/**
 * Sanitiza y formatea un mensaje individual asegurando que DeepSeek reciba
 * estrictamente las propiedades esperadas: { role: string, content: string }
 * @param {Object} msg
 * @returns {{ role: string, content: string }}
 */
const formatearMensajeDeepSeek = (msg) => {
  if (!msg) {
    return { role: 'user', content: '' };
  }

  const role = msg.role || 'user';
  let content = '';

  // Si el mensaje viene con propiedades 'descripcion' y 'pregunta' separadas
  if (msg.descripcion && msg.pregunta) {
    content = `Contexto: ${msg.descripcion}. Pregunta: ${msg.pregunta}`;
  } else if (msg.descripcion) {
    content = `Contexto: ${msg.descripcion}`;
  } else if (msg.pregunta) {
    content = `Pregunta: ${msg.pregunta}`;
  } else if (typeof msg.content === 'string') {
    content = msg.content;
  } else if (msg.content && typeof msg.content === 'object') {
    // Si content es un objeto con descripcion y/o pregunta
    if (msg.content.descripcion && msg.content.pregunta) {
      content = `Contexto: ${msg.content.descripcion}. Pregunta: ${msg.content.pregunta}`;
    } else if (msg.content.descripcion) {
      content = String(msg.content.descripcion);
    } else if (msg.content.pregunta) {
      content = String(msg.content.pregunta);
    } else {
      content = JSON.stringify(msg.content);
    }
  } else {
    content = String(msg.content ?? '');
  }

  // Retornar estrictamente solo role y content (string limpio) para evitar error 400 en DeepSeek
  return {
    role,
    content: String(content).trim(),
  };
};

/**
 * Realiza una consulta de chat completions a DeepSeek
 * @param {Object} params
 * @param {string} [params.system] - Mensaje de sistema / rol
 * @param {Array<{role: string, content: string}>} [params.messages] - Lista de mensajes previos y actuales
 * @returns {Promise<string>} Texto de la respuesta generada
 */
const chat = async ({ system, messages = [] }) => {
  const fullMessages = [];

  if (system) {
    fullMessages.push({
      role: 'system',
      content: typeof system === 'string' ? system : String(system),
    });
  }

  if (Array.isArray(messages)) {
    for (const msg of messages) {
      fullMessages.push(formatearMensajeDeepSeek(msg));
    }
  }

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: fullMessages,
  });

  // Extraer y registrar en consola el uso de tokens devuelto por la API
  if (response.usage) {
    console.log('Uso de tokens DeepSeek:', {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    });
  }

  return response.choices[0]?.message?.content || '';
};

module.exports = {
  chat,
  formatearMensajeDeepSeek,
};
