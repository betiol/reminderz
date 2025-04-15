import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor informe um email válido'
      ]
    },
    firebaseUid: {
      type: String,
      unique: true,
      required: true
    },
    profilePicture: {
      type: String,
      default: null
    },
    fcmTokens: {
      type: [String],
      default: []
    },
    timezone: {
      type: String,
      default: 'America/Cuiaba'
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      reminderTime: {
        type: Number, 
        default: 30
      }
    },
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      language: {
        type: String,
        enum: ['pt-BR', 'en-US', 'es-ES'],
        default: 'pt-BR'
      },
      startDayOfWeek: {
        type: Number, 
        enum: [0, 1, 2, 3, 4, 5, 6],
        default: 0
      }
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)


UserSchema.index({ firebaseUid: 1 })
UserSchema.index({ email: 1 })


UserSchema.methods.addFcmToken = async function (token) {
  
  if (!this.fcmTokens.includes(token)) {
    this.fcmTokens.push(token)
    await this.save()
  }
  return this
}


UserSchema.methods.removeFcmToken = async function (token) {
  this.fcmTokens = this.fcmTokens.filter((t) => t !== token)
  await this.save()
  return this
}


UserSchema.methods.formatDate = function (date, formatStr) {
  if (!date) return null
  
  return date
}

export default mongoose.model('User', UserSchema)
