
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import { connectDB } from './config/db.js'
import { initializeFirebase } from './config/firebase.js'
initializeFirebase()

import { initializeTopics, setupSubscriptions } from './config/pubsub.js'
import { setupTaskScheduler } from './services/schedulerService.js'
import { setupDailyEmailScheduler } from './services/email/setupEmailScheduler.js'


import taskRoutes from './routes/taskRoutes.js'
import authRoutes from './routes/authRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import internalRoutes from './routes/internalRoutes.js'
import userRoutes from './routes/userRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'


import { createDefaultCategories } from './controllers/categoryController.js'


import { errorHandler } from './middleware/error.js'


dotenv.config()


const app = express()
const PORT = process.env.PORT || 5000


await connectDB()


await createDefaultCategories()




const pubsubInitialized = await initializeTopics().catch((err) => {
  console.error('Erro ao inicializar Pub/Sub:', err)
  return false
})

if (pubsubInitialized) {
  
  await setupSubscriptions()

  
  await setupTaskScheduler()
  
  
  await setupDailyEmailScheduler()
}



const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, tente novamente após 10 minutos'
})


app.use(cors())
app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(mongoSanitize())
app.use(compression())
if (process.env.NODE_ENV !== 'development') {
  app.use(limiter)
}


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}


app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/internal', internalRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)


app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Lembrete funcionando!',
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  })
})


app.get('/health', (req, res) => {
  res.status(200).send('OK')
})


app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado'
  })
})


app.use(errorHandler)


const server = app.listen(PORT, () => {
  console.log(
    `Servidor rodando na porta ${PORT} em ambiente ${process.env.NODE_ENV}`
  )
})


process.on('unhandledRejection', (err) => {
  console.error(`Erro: ${err.message}`)
  console.error(err.stack)

  
  server.close(() => {
    console.log('Servidor fechado devido a erro não tratado')
    process.exit(1)
  })

  
  setTimeout(() => {
    console.error('Fechamento forçado do servidor após timeout')
    process.exit(1)
  }, 10000)
})


process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)


function gracefulShutdown() {
  console.log('Recebido sinal de término, fechando servidor graciosamente')
  server.close(() => {
    console.log('Servidor fechado')
    process.exit(0)
  })

  
  setTimeout(() => {
    console.error('Fechamento forçado após timeout')
    process.exit(1)
  }, 10000)
}

export default server
