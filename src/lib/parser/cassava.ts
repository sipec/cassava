type CassavaParsed =
 | {
    isCassava: true
    data: string[][]
    firstBodyRow: number
   }
 | {
    isCassava: false
    data: string[][]
    firstBodyRow: 0
   }

export const parseCassava = (csv: string[][]): CassavaParsed => {
 // Handle non-cassava files
 if (!csv[0]?.length || csv[0][0] !== '0-cassava') {
  return {
   isCassava: false,
   data: csv,
   firstBodyRow: 0,
  }
 }

 // Handle cassava files
 const firstRow = csv.findIndex((row) => !row[0]?.startsWith('0'))
 if (firstRow === -1) {
  console.log('No data rows found in cassava file')
  return {
   isCassava: true,
   data: csv,
   firstBodyRow: csv.length,
  }
 }

 const body = csv.slice(firstRow)
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
  isCassava: true,
  data: [...headers, ...body],
  firstBodyRow: firstRow,
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
