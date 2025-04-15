import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome da categoria é obrigatório'],
      trim: true,
      maxlength: [30, 'Nome da categoria não pode ter mais de 30 caracteres']
    },
    icon: {
      type: String,
      required: [true, 'Ícone da categoria é obrigatório']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

CategorySchema.index({ user: 1 })
CategorySchema.index({ isDefault: 1 })

export default mongoose.model('Category', CategorySchema)