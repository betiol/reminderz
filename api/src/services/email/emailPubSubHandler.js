import { processDailyTaskEmails, processSingleUserEmail } from './taskEmailProcessor.js';

/**
 * Handler para processar mensagens do PubSub para emails
 * @param {Object} message - Mensagem recebida do PubSub
 * @param {Object} context - Contexto da função
 */
export const handleEmailPubSubMessage = async (message, context) => {
  try {
    let data = {};

    if (message.data) {
      const decodedString = Buffer.from(message.data, 'base64').toString('utf-8');
      console.log('Dados decodificados da mensagem PubSub:', decodedString);
      
      try {
        data = JSON.parse(decodedString);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON da mensagem:', parseError);
      }
    }
    
    console.log('Mensagem PubSub recebida para processamento de email:', data);
    
    const operation = data.operation || 'daily-summary';
    const userId = data.userId;
    
    console.log(`Processando operação: ${operation}, userId: ${userId || 'todos'}`);
    
    switch (operation) {
      case 'daily-summary':
        return await processDailyTaskEmails();
        
      case 'single-user':
        if (!userId) {
          throw new Error('userId é obrigatório para operação single-user');
        }
        return await processSingleUserEmail(userId);
        
      default:
        throw new Error(`Operação desconhecida: ${operation}`);
    }
  } catch (error) {
    console.error('Erro ao processar mensagem PubSub para email:', error);
    throw error;
  }
};