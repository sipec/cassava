export type ColumnType =
 | 'text'
 | 'number'
 | 'date'
 | 'logical'
 | 'select'
 | 'multiselect'
 | 'formula'

export const parseColumnType = (type: string): ColumnType => {
 if (!type) return 'text'

 const [baseType] = type.split(':')
 switch (baseType) {
  case 'text':
  case 'number':
  case 'date':
  case 'logical':
  case 'select':
  case 'multiselect':
  case 'formula':
   return baseType
  default:
   console.warn(`Unknown column type: ${type}, falling back to string`)
   return 'text'
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
