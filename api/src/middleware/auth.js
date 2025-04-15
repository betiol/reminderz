import { auth } from '../config/firebase.js'
import User from '../models/User.js'
import ErrorResponse from '../utils/errorResponse.js'
import { asyncHandler } from './async.js'

const firebaseAuth = auth()

export const protect = asyncHandler(async (req, res, next) => {
  let token


  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
  
    token = req.headers.authorization.split(' ')[1]
  }


  if (!token) {
    return next(new ErrorResponse('Acesso não autorizado', 401))
  }

  try {
  
    const decodedToken = await firebaseAuth.verifyIdToken(token)

  
    const user = await User.findOne({ firebaseUid: decodedToken.uid })

    if (!user) {
      return next(new ErrorResponse('Usuário não encontrado', 404))
    }

  
    req.user = user
    next()
  } catch (error) {
    return next(new ErrorResponse('Token inválido ou expirado', 401))
  }
})
