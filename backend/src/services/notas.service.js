const AppError = require('../utils/errors');
const { chat } = require('./llm.service');

// Almacén en memoria inicializado con datos de ejemplo
let notas = [
  {
    id: 1,
    titulo: 'Arquitectura del Sistema Distribuido',
    contenido: 'Definir la arquitectura de microservicios utilizando Node.js, Express y bases de datos PostgreSQL para transacciones y Redis para caché. Implementar autenticación JWT y rate limiting por IP.',
    categoria: 'Arquitectura',
    createdAt: new Date('2026-11-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-01T10:00:00Z').toISOString(),
  },
  {
    id: 2,
    titulo: 'Requerimientos de Base de Datos - E-commerce',
    contenido: 'El sistema de comercio electrónico requiere modelar entidades para Usuarios, Perfiles, Productos, Categorías, Órdenes de Compra y Detalle de Órdenes. Asegurar claves foráneas e integridad referencial en cascada.',
    categoria: 'Base de Datos',
    createdAt: new Date('2026-11-05T14:30:00Z').toISOString(),
    updatedAt: new Date('2026-11-05T14:30:00Z').toISOString(),
  },
];

let nextId = 3;

class NotasService {
  /**
   * Obtiene todas las notas con soporte para filtros por categoría, búsqueda de texto y paginación
   * @param {Object} [filtros]
   * @param {string} [filtros.categoria]
   * @param {string} [filtros.busqueda]
   * @param {number} [filtros.limite]
   * @param {number} [filtros.pagina]
   */
  async listar({ categoria, busqueda, limite = 10, pagina = 1 } = {}) {
    let resultado = [...notas];

    if (categoria) {
      resultado = resultado.filter(
        (n) => n.categoria.toLowerCase() === String(categoria).toLowerCase()
      );
    }

    if (busqueda) {
      const q = String(busqueda).toLowerCase();
      resultado = resultado.filter(
        (n) => n.titulo.toLowerCase().includes(q) || n.contenido.toLowerCase().includes(q)
      );
    }

    const total = resultado.length;
    const limitNum = Math.max(1, Number(limite) || 10);
    const pageNum = Math.max(1, Number(pagina) || 1);
    const inicio = (pageNum - 1) * limitNum;
    const paginado = resultado.slice(inicio, inicio + limitNum);

    return {
      total,
      pagina: pageNum,
      limite: limitNum,
      totalPaginas: Math.ceil(total / limitNum) || 1,
      datos: paginado,
    };
  }

  /**
   * Obtiene una nota por su ID
   * @param {number} id
   */
  async obtenerPorId(id) {
    const nota = notas.find((n) => n.id === Number(id));
    if (!nota) {
      throw new AppError(404, `No se encontró ninguna nota con el ID ${id}`);
    }
    return nota;
  }

  /**
   * Crea una nueva nota
   * @param {Object} param0
   */
  async crear({ titulo, contenido, categoria = 'General' }) {
    const nuevaNota = {
      id: nextId++,
      titulo,
      contenido,
      categoria,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notas.push(nuevaNota);
    return nuevaNota;
  }

  /**
   * Actualiza una nota existente
   * @param {number} id
   * @param {Object} datos
   */
  async actualizar(id, datos) {
    const index = notas.findIndex((n) => n.id === Number(id));
    if (index === -1) {
      throw new AppError(404, `No se encontró ninguna nota con el ID ${id} para actualizar`);
    }

    notas[index] = {
      ...notas[index],
      ...datos,
      id: notas[index].id, // Evita sobreescribir el ID
      updatedAt: new Date().toISOString(),
    };

    return notas[index];
  }

  /**
   * Elimina una nota por su ID
   * @param {number} id
   */
  async eliminar(id) {
    const index = notas.findIndex((n) => n.id === Number(id));
    if (index === -1) {
      throw new AppError(404, `No se encontró ninguna nota con el ID ${id} para eliminar`);
    }

    const notaEliminada = notas.splice(index, 1)[0];
    return notaEliminada;
  }

  /**
   * Genera un resumen ejecutivo en viñetas de una nota mediante DeepSeek LLM
   * @param {number} id
   */
  async generarResumenIA(id) {
    const nota = await this.obtenerPorId(id);

    const systemPrompt = `Eres un asistente de síntesis ejecutiva de alto nivel para ingenieros de software y líderes de producto.
Tu tarea es leer el título y contenido de una nota técnica y generar:
1. Un resumen ejecutivo en 3 a 5 viñetas concisas y directas.
2. Una lista de acciones recomendadas o próximos pasos sugeridos.
Utiliza formato Markdown profesional.`;

    const userPrompt = `Por favor genera el resumen ejecutivo de la siguiente nota:
- Título: ${nota.titulo}
- Categoría: ${nota.categoria}
- Contenido completo:
"""
${nota.contenido}
"""`;

    const resumen = await chat({
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return {
      notaId: nota.id,
      titulo: nota.titulo,
      resumenEjecutivo: resumen,
      generadoEn: new Date().toISOString(),
    };
  }
}

module.exports = new NotasService();

