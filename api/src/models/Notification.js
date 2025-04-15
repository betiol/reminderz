import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  type: {
    type: String,
    enum: ['task_reminder', 'task_updated', 'task_completed', 'task_overdue', 'system', 'info'],
    default: 'system',
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  sentToDevice: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal'
  },
  expiresAt: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 30); 
      return date;
    }
  },
  actions: [{
    label: String,
    action: String,
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});


NotificationSchema.index({ user: 1, read: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 


NotificationSchema.methods.getTimeAgo = function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return 'agora';
  } else if (minutes < 60) {
    return `${minutes} min atrás`;
  } else if (hours < 24) {
    return `${hours} h atrás`;
  } else if (days < 7) {
    return `${days} dias atrás`;
  } else {
    const options = { day: 'numeric', month: 'short' };
    return this.createdAt.toLocaleDateString('pt-BR', options);
  }
};


NotificationSchema.methods.getActionUrl = function(actionId) {
  if (!this.actions || !this.actions.length) return null;
  
  const action = this.actions.find(a => a.action === actionId);
  if (!action) return null;
  
  
  let url = '/';
  
  switch (this.type) {
    case 'task_reminder':
    case 'task_updated':
    case 'task_completed':
    case 'task_overdue':
      if (this.data && this.data.taskId) {
        url = `/tasks/${this.data.taskId}`;
      } else {
        url = '/tasks';
      }
      break;
    case 'system':
    case 'info':
      url = '/notifications';
      break;
  }
  
  
  if (action.data && action.data.params) {
    const params = new URLSearchParams(action.data.params);
    url += `?${params.toString()}`;
  }
  
  return url;
};

export default mongoose.model('Notification', NotificationSchema);