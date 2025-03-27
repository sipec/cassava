export type ColumnType =
 | 'string'
 | 'number'
 | 'date'
 | 'logical'
 | 'select'
 | 'multiselect'

export const parseColumnType = (type: string): ColumnType => {
 try {
  if (!type) return 'string'

  const [baseType] = type.split(':')
  switch (baseType) {
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
 } catch (error) {
  console.error('Error parsing column type:', error)
  console.error('Type string:', type)
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
