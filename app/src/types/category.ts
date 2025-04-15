export interface Category {
  _id: string
  name: string
  icon: string
  user?: string
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateCategoryDto {
  name: string
  icon: string
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}