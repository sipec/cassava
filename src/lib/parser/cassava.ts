type CassavaParsed =
 | {
    headers: string[][]
    data: string[][]
    isCassava: true
   }
 | {
    headers: null
    data: string[][]
    isCassava: false
   }

export const parseCassava = (csv: string[][]): CassavaParsed => {
 // Handle non-cassava files
 if (!csv[0]?.length || csv[0][0] !== '0-cassava') {
  return {
   headers: null,
   data: csv,
   isCassava: false,
  }
 }

 // Handle cassava files
 const firstRow = csv.findIndex((row) => !row[0]?.startsWith('0'))
 if (firstRow === -1) {
  console.warn('No data rows found in cassava file')
  return {
   headers: csv,
   data: [],
   isCassava: true,
  }
 }

 const data = csv.slice(firstRow)
 const rawHeaders = csv.slice(0, firstRow)
 const headers = rawHeaders.sort(
  compareBy((row: string[]) => {
   // strip beginning '0-' prefix
   const title = row[0]?.replace(/^0-/, '') || ''
   const index = THE_ORDER.indexOf(title as any)
   if (index === -1) return THE_ORDER.length
   return index
  }),
 )

 return {
  headers,
  data,
  isCassava: true,
 }
}

export const THE_ORDER = [
 'cassava',
 'type',
 'null-default',
 // 'default',
 // 'style',
] as const

const compareBy =
 <T>(thing: (x: T) => number) =>
 (a: T, b: T) => {
  try {
   const aNum = thing(a)
   const bNum = thing(b)
   return aNum - bNum
  } catch (error) {
   console.error('Error in compareBy:', error)
   return 0
  }
 }
