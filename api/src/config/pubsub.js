import { PubSub } from '@google-cloud/pubsub'
import dotenv from 'dotenv'
import {
  processTaskReminder,
  processNewNotification
} from '../services/notificationService.js'
import { processSchedulerMessage } from '../services/schedulerService.js'
import { handleEmailPubSubMessage } from '../services/email/emailPubSubHandler.js'
import { processRecurringTaskMessage } from '../services/recurringTaskService.js'

dotenv.config()



const pubSubClient = new PubSub({
  projectId: 'reminderz-app'
})


export const TOPICS = {
  TASK_REMINDERS: 'task-reminders',
  NOTIFICATIONS: 'notifications',
  USER_EVENTS: 'user-events',
  TASK_EMAILS: 'task-emails',
  RECURRING_TASKS: 'recurring-tasks'
}


export const initializeTopics = async () => {
  try {
    console.log('Inicializando tópicos do Google Pub/Sub...')

    for (const topicName of Object.values(TOPICS)) {
      const [exists] = await pubSubClient.topic(topicName).exists()

      if (!exists) {
        await pubSubClient.createTopic(topicName)
        console.log(`Tópico ${topicName} criado com sucesso.`)
      } else {
        console.log(`Topic ${topicName} já existe.`)
      }
    }

    return true
  } catch (error) {
    console.error('Erro ao inicializar tópicos do Pub/Sub:', error)
    return false
  }
}


export const setupSubscriptions = async () => {
  try {
    
    await createOrGetSubscription(
      TOPICS.TASK_REMINDERS,
      'task-reminders-subscription',
      processSchedulerMessage
    )

    
    await createOrGetSubscription(
      TOPICS.NOTIFICATIONS,
      'notifications-subscription',
      processNewNotification
    )
    
    
    await createOrGetSubscription(
      TOPICS.TASK_EMAILS,
      'task-emails-subscription',
      handleEmailPubSubMessage
    )
    
    
    await createOrGetSubscription(
      TOPICS.RECURRING_TASKS,
      'recurring-tasks-subscription',
      processRecurringTaskMessage
    )

    console.log('Assinaturas do Pub/Sub configuradas com sucesso.')
  } catch (error) {
    console.error('Erro ao configurar assinaturas do Pub/Sub:', error)
  }
}


const createOrGetSubscription = async (
  topicName,
  subscriptionName,
  messageHandler
) => {
  const topic = pubSubClient.topic(topicName)
  const subscription = topic.subscription(subscriptionName)

  
  const [exists] = await subscription.exists()

  if (!exists) {
    
    await topic.createSubscription(subscriptionName, {
      ackDeadlineSeconds: 60,
      expirationPolicy: { ttl: { seconds: 86400 * 365 } } 
    })
    console.log(`Assinatura ${subscriptionName} criada.`)
  } else {
    console.log(`Assinatura ${subscriptionName} já existe.`)
  }

  
  subscription.on('message', (message) => {
    try {
      console.log('message raw data:', message.data.toString()) 
      console.log('message attributes:', message.attributes) 

      
      
      messageHandler(message)
      message.ack()
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      message.nack()
    }
  })

  subscription.on('error', (error) => {
    console.error(`Erro na assinatura ${subscriptionName}:`, error)
  })

  return subscription
}


export const publishMessage = async (topicName, data, attributes = {}) => {
  console.log('topicName', topicName, 'data', data, 'attributes', attributes)
  try {
    const topic = pubSubClient.topic(topicName)
    const message = {
      data: Buffer.from(JSON.stringify(data)),
      attributes: attributes
    }
    const messageId = await topic.publishMessage(message)

    console.log(`Mensagem ${messageId} publicada no tópico ${topicName}`)
    return messageId
  } catch (error) {
    console.error(`Erro ao publicar mensagem no tópico ${topicName}:`, error)
    throw error
  }
}
