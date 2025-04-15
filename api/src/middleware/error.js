import ErrorResponse from '../utils/errorResponse.js'

export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  console.error(err)

  if (err.name === 'CastError') {
    const message = `Recurso não encontrado`
    error = new ErrorResponse(message, 404)
  }

  if (err.code === 11000) {
    const message = 'Valor duplicado inserido'
    error = new ErrorResponse(message, 400)
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message)
    error = new ErrorResponse(message, 400)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erro de servidor'
  })
}
