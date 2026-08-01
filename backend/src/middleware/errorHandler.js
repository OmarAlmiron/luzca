export function notFound(req, res, next) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Error interno del servidor'
    : err.message;
  res.status(status).json({ error: message });
}
