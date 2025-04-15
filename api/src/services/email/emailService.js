import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import moment from 'moment-timezone'
import nodemailerSendgrid from 'nodemailer-sendgrid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }

  return nodemailer.createTransport(
    nodemailerSendgrid({
      apiKey: process.env.SENDGRID_API_KEY
    })
  )
}

const getEmailTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../../templates/email',
      `${templateName}.html`
    )
    let template = await fs.readFile(templatePath, 'utf8')

    template = processConditionals(template, data);
    
    template = processLoops(template, data);
    
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      
      if (typeof data[key] === 'object' && data[key] !== null) {
      } else {
        template = template.replace(regex, data[key])
      }
    })

    return template
  } catch (error) {
    console.error('Erro ao ler template de email:', error)
    throw new Error('Falha ao processar template de email')
  }
}

function processConditionals(template, data) {
  let result = template.replace(/{{\s*#if\s+([^}]+)\s*}}\s*([\s\S]*?)\s*{{\s*\/if\s*}}/g, 
    (match, condition, content) => {
      const condValue = data[condition.trim()];
      return condValue ? content : '';
    });
  
  result = result.replace(/{{\s*\^([^}]+)\s*}}\s*([\s\S]*?)\s*{{\s*\/\1\s*}}/g, 
    (match, condition, content) => {
      const condValue = data[condition.trim()];
      return !condValue || (Array.isArray(condValue) && condValue.length === 0) ? content : '';
    });
  
  return result;
}

function processLoops(template, data) {
  return template.replace(/{{\s*#([^}]+)\s*}}\s*([\s\S]*?)\s*{{\s*\/\1\s*}}/g, 
    (match, collectionName, itemTemplate) => {
      const collection = data[collectionName];
      
      if (!Array.isArray(collection)) {
      }
      
      return collection.map(item => {
        let result = itemTemplate;
        
        Object.keys(item).forEach(key => {
          if (typeof item[key] === 'object' && item[key] !== null) {
          } else {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, item[key]);
          }
        });
        
        result = result.replace(/{{\s*#if\s+([^}]+)\s*}}\s*([\s\S]*?)\s*{{\s*\/if\s*}}/g, 
          (match, condition, content) => {
            return item[condition.trim()] ? content : '';
          });
        
        return result;
      }).join('');
    });
}

const formatDateTime = (date, time, timezone) => {
  try {
    const dateTimeStr = `${date}T${time}`
    
    const momentDate = moment.tz(dateTimeStr, timezone || 'UTC')
    return momentDate.format('DD/MM/YYYY HH:mm')
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return date + ' ' + time
  }
}

const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"reminderz" <no-reply@em6693.reminderz.club>',
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email');
  }
};

const sendDailyTaskSummary = async (user, processedTasks) => {
  if (!user.email || !user.notificationPreferences?.email) {
    console.log(
      `Usuário ${user._id} não tem email ou preferências de notificação por email desativadas`
    )
    return null
  }

  const overdueTasks = processedTasks.filter(task => task.status === 'overdue');
  const todayTasks = processedTasks.filter(task => task.status === 'today');
  const tomorrowTasks = processedTasks.filter(task => task.status === 'tomorrow');

  const userTimezone = user.timezone || 'UTC';
  const today = moment().tz(userTimezone);

  console.log(`Preparando email com ${overdueTasks.length} tarefas vencidas, ${todayTasks.length} tarefas de hoje e ${tomorrowTasks.length} tarefas de amanhã`);

  const translatePriority = (priority) => {
    switch(priority) {
      case 'high': 
      case 'alta': return 'Alta Prioridade';
      case 'medium': 
      case 'média': return 'Média Prioridade';
      case 'low': 
      case 'baixa': return 'Baixa Prioridade';
      default: return priority;
    }
  };

  const formatTasksForDisplay = (tasks) => {
    return tasks.map(task => ({
      ...task,
      priority: translatePriority(task.priority)
    }));
  };

  const templateData = {
    userName: user.name || 'Usuário',
    date: today.format('DD/MM/YYYY'),
    overdueTasksCount: overdueTasks.length,
    todayTasksCount: todayTasks.length,
    tomorrowTasksCount: tomorrowTasks.length,
    overdueTasks: formatTasksForDisplay(overdueTasks),
    todayTasks: formatTasksForDisplay(todayTasks),
    tomorrowTasks: formatTasksForDisplay(tomorrowTasks),
    baseUrl: process.env.APP_URL || 'https://reminderz.club'
  }
  
  templateData.overdueTasksJSON = JSON.stringify(overdueTasks);
  templateData.todayTasksJSON = JSON.stringify(todayTasks);
  templateData.tomorrowTasksJSON = JSON.stringify(tomorrowTasks);

  const html = await getEmailTemplate('dailyTaskSummary', templateData)

  return sendEmail(user.email, `Resumo de Tarefas - ${templateData.date}`, html)
}

export { sendEmail, sendDailyTaskSummary, formatDateTime }
