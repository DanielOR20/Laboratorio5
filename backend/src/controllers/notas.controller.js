const notasService = require('../services/notas.service');

class NotasController {
  async listar(req, res, next) {
    try {
      const { categoria, busqueda, limite, pagina } = req.query;
      const resultado = await notasService.listar({
        categoria,
        busqueda,
        limite,
        pagina,
      });

      return res.status(200).json({
        status: 'success',
        ...resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const nota = await notasService.obtenerPorId(id);
      return res.status(200).json({
        status: 'success',
        datos: nota,
      });
    } catch (error) {
      next(error);
    }
  }

  async crear(req, res, next) {
    try {
      const { titulo, contenido, categoria } = req.body;
      const nuevaNota = await notasService.crear({ titulo, contenido, categoria });
      return res.status(201).json({
        status: 'success',
        mensaje: 'Nota creada exitosamente',
        datos: nuevaNota,
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const datosActualizados = req.body;
      const nota = await notasService.actualizar(id, datosActualizados);
      return res.status(200).json({
        status: 'success',
        mensaje: 'Nota actualizada exitosamente',
        datos: nota,
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      await notasService.eliminar(id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async generarResumenIA(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await notasService.generarResumenIA(id);
      return res.status(200).json({
        status: 'success',
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotasController();

