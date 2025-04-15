import moment from 'moment-timezone';
import mongoose from 'mongoose';
import { sendDailyTaskSummary } from './emailService.js';


const User = mongoose.model('User');
const Task = mongoose.model('Task');


const processDailyTaskEmails = async () => {
  console.log(`Iniciando processamento de emails diários: ${new Date().toISOString()}`);
  
  try {
    
    const users = await User.find({
      'notificationPreferences.email': true,
      email: { $exists: true, $ne: '' }
    });
    
    console.log(`Encontrados ${users.length} usuários para envio de email`);
    
    
    const chunkSize = 10;
    const promises = [];
    
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      promises.push(processUserChunk(chunk));
    }
    
    await Promise.all(promises);
    console.log(`Processamento de emails diários concluído`);
    
    return {
      success: true,
      processedCount: users.length
    };
  } catch (error) {
    console.error('Erro ao processar emails diários:', error);
    throw error;
  }
};

/**
 * Processa um grupo de usuários para envio de emails
 */
const processUserChunk = async (users) => {
  const emailPromises = users.map(user => processUserTaskEmail(user));
  await Promise.allSettled(emailPromises);
};

/**
 * Processa o envio de email para um único usuário
 */
const processUserTaskEmail = async (user) => {
  try {
    const userTimezone = user.timezone || 'UTC';
    
    
    const userNow = moment().tz(userTimezone);
    
    
    const startOfToday = userNow.clone().startOf('day');
    const endOfToday = userNow.clone().endOf('day');
    
    
    const startOfTomorrow = userNow.clone().add(1, 'day').startOf('day');
    const endOfTomorrow = userNow.clone().add(1, 'day').endOf('day');
    
    
    const todayDateStr = startOfToday.format('YYYY-MM-DD');
    const tomorrowDateStr = startOfTomorrow.format('YYYY-MM-DD');
    
    console.log(`Processando tarefas para ${user.email} (${userTimezone})`);
    console.log(`Hoje: ${todayDateStr}, Amanhã: ${tomorrowDateStr}`);
    console.log(`Início hoje: ${startOfToday.toISOString()}, Fim hoje: ${endOfToday.toISOString()}`);
    console.log(`Início amanhã: ${startOfTomorrow.toISOString()}, Fim amanhã: ${endOfTomorrow.toISOString()}`);
    
    
    
    const startOfTodayUTC = startOfToday.toDate();
    const endOfTodayUTC = endOfToday.toDate();
    const startOfTomorrowUTC = startOfTomorrow.toDate();
    const endOfTomorrowUTC = endOfTomorrow.toDate();
    
    console.log(`Consultando tarefas com datas no intervalo:
    - Hoje: entre ${startOfTodayUTC.toISOString()} e ${endOfTodayUTC.toISOString()}
    - Amanhã: entre ${startOfTomorrowUTC.toISOString()} e ${endOfTomorrowUTC.toISOString()}
    `);
    
    
    const tasks = await Task.find({
      user: user._id, 
      completed: false,
      $or: [
        { date: { $lt: startOfTodayUTC } },              
        { date: { $gte: startOfTodayUTC, $lte: endOfTodayUTC } },  
        { date: { $gte: startOfTomorrowUTC, $lte: endOfTomorrowUTC } }  
      ]
    }).sort({ date: 1, time: 1 });
    
    if (tasks.length === 0) {
      console.log(`Nenhuma tarefa encontrada para o usuário ${user._id}`);
      return null;
    }
    
    console.log(`Encontradas ${tasks.length} tarefas para o usuário ${user.email}`);
    
    
    tasks.forEach((task, index) => {
      console.log(`Task ${index+1}: ID=${task._id}, Data=${task.date.toISOString()}, Hora=${task.time}, Título=${task.title}`);
    });
    
    
    const processedTasks = tasks.map(task => {
      
      console.log(`Processando tarefa: ${task.title}, Data original UTC: ${task.date.toISOString()}, Hora: ${task.time}`);
      
      
      const taskDate = moment.utc(task.date).tz(userTimezone);
      
      
      const [hours, minutes] = task.time.split(':').map(num => parseInt(num, 10));
      taskDate.hours(hours).minutes(minutes).seconds(0).milliseconds(0);
      
      
      console.log(`Data convertida para timezone: ${userTimezone}`);
      console.log(`Ano: ${taskDate.year()}, Mês: ${taskDate.month()+1}, Dia: ${taskDate.date()}`);
      console.log(`Hora: ${taskDate.hour()}, Minuto: ${taskDate.minute()}`);
      console.log(`Data formatada: ${taskDate.format('YYYY-MM-DD HH:mm')}`);
      console.log(`Data ISO com TZ: ${taskDate.format()}`);
      
      
      let status;
      if (taskDate.isBefore(startOfToday)) {
        status = 'overdue';
      } else if (taskDate.isBefore(endOfToday)) {
        status = 'today';
      } else if (taskDate.isBefore(endOfTomorrow)) {
        status = 'tomorrow';
      } else {
        status = 'future';
      }
      
      console.log(`Status da tarefa: ${status}`);
      
      
      const formattedDate = taskDate.format('DD/MM/YYYY HH:mm');
      
      
      return {
        ...task.toObject(),
        status,
        formattedDate,
        taskMoment: taskDate.format(), 
        
        taskDay: taskDate.date(),
        taskMonth: taskDate.month() + 1, 
        taskYear: taskDate.year()
      };
    });
    
    console.log(`Enviando email com ${processedTasks.length} tarefas para ${user.email}`);
    
    
    const result = await sendDailyTaskSummary(user, processedTasks);
    
    return result;
  } catch (error) {
    console.error(`Erro ao processar email para usuário ${user._id}:`, error);
    console.error(error.stack);
    
    return null;
  }
};

/**
 * Processa apenas um usuário específico (útil para testes)
 */
const processSingleUserEmail = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`Usuário não encontrado: ${userId}`);
    }
    
    return await processUserTaskEmail(user);
  } catch (error) {
    console.error(`Erro ao processar email para usuário específico ${userId}:`, error);
    throw error;
  }
};

export {
  processDailyTaskEmails,
  processSingleUserEmail
};