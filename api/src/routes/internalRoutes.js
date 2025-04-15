import express from 'express';
import mongoose from 'mongoose';
import { sendReminder, healthCheck } from '../controllers/internalController.js';
import { processSingleUserEmail } from '../services/email/taskEmailProcessor.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.post('/send-reminder', sendReminder);
router.get('/health-check', healthCheck);



router.post('/test-email', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'ID do usuário é obrigatório'
    });
  }
  
  try {
    console.log(`Iniciando teste de email para usuário ID: ${userId}`);
    const result = await processSingleUserEmail(userId);
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Email de teste enviado com sucesso',
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Não foi possível enviar o email (usuário não encontrado ou sem tarefas)'
      });
    }
  } catch (error) {
    console.error('Erro ao testar envio de email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar envio de email de teste'
    });
  }
}));


router.post('/create-test-task', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'ID do usuário é obrigatório'
    });
  }
  
  try {
    
    const Task = mongoose.model('Task');
    
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    
    const todayUTC = new Date(Date.UTC(year, month, day));
    
    
    const task = new Task({
      title: `Tarefa de teste criada em ${new Date().toISOString()}`,
      description: 'Esta é uma tarefa de teste criada para verificar o envio de emails',
      date: todayUTC,
      time: '10:00',
      priority: 'alta',
      user: userId,
      category: 'pessoal',
      tags: ['teste', 'email']
    });
    
    
    await task.save();
    
    res.status(201).json({
      success: true,
      message: 'Tarefa de teste criada com sucesso',
      data: {
        taskId: task._id,
        date: task.date,
        time: task.time,
        title: task.title
      }
    });
  } catch (error) {
    console.error('Erro ao criar tarefa de teste:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar tarefa de teste'
    });
  }
}));

export default router;