import { CloudSchedulerClient } from '@google-cloud/scheduler';
import { PubSub } from '@google-cloud/pubsub';

export const setupDailyEmailScheduler = async () => {
  try {
    
    const pubsub = new PubSub();
    const topicName = 'task-emails';
    
    let topic;
    try {
      [topic] = await pubsub.createTopic(topicName);
      console.log(`Tópico ${topicName} criado.`);
    } catch (error) {
      
      if (error.code === 6) { 
        topic = pubsub.topic(topicName);
        console.log(`Tópico ${topicName} já existe.`);
      } else {
        throw error;
      }
    }
    
    
    const scheduler = new CloudSchedulerClient();
    
    
    const parent = scheduler.locationPath(process.env.GOOGLE_CLOUD_PROJECT_ID, process.env.GOOGLE_CLOUD_LOCATION || 'us-central1');
    const jobName = `daily-task-email-job`;
    const job = {
      name: scheduler.jobPath(process.env.GOOGLE_CLOUD_PROJECT_ID, process.env.GOOGLE_CLOUD_LOCATION || 'us-central1', jobName),
      pubsubTarget: {
        topicName: topic.name,
        data: Buffer.from(JSON.stringify({ operation: 'daily-summary' })).toString('base64'),
        attributes: { 
          service: 'email',
          type: 'daily-summary',
        }
      },
      
      schedule: '0 7 * * *',
      timeZone: 'UTC',
    };
    
    
    try {
      await scheduler.getJob({ name: job.name });
      console.log(`Job ${jobName} já existe, atualizando...`);
      await scheduler.updateJob({ job });
      console.log(`Job ${jobName} atualizado.`);
    } catch (error) {
      
      if (error.code === 5) { 
        await scheduler.createJob({ parent, job });
        console.log(`Job ${jobName} criado.`);
      } else {
        throw error;
      }
    }
    
    console.log('Scheduler de emails diários configurado com sucesso.');
    return true;
  } catch (error) {
    console.error('Erro ao configurar scheduler de emails:', error);
    throw error;
  }
};