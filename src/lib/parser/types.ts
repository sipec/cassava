export type ColumnType =
 | 'string'
 | 'number'
 | 'date'
 | 'logical'
 | 'select'
 | 'multiselect'

export const parseColumnType = (type: string): ColumnType => {
 if (!type) return 'string'

 const [baseType] = type.split(':')
 switch (baseType) {
  case 'string':
  case 'number':
  case 'date':
  case 'logical':
  case 'select':
  case 'multiselect':
   return baseType
  default:
   console.warn(`Unknown column type: ${type}, falling back to string`)
   return 'string'
 }
}

export const parseSelectOptions = (type: string): string[] => {
 try {
  const [baseType, options] = type.split(':')
  if (baseType !== 'select' && baseType !== 'multiselect') return []
  if (!options) {
   console.warn(`No options provided for select/multiselect: ${type}`)
   return []
  }
  return options.split('|')
 } catch (error) {
  console.error('Error parsing select options:', error)
  console.error('Type string:', type)
  return []
 }
}
