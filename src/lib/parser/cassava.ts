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
 // Rectangularize
 const max = Math.max(...csv.map((row) => row.length))
 const ret = csv.map((row) => padEnd(row, max, ''))

 // Handle non-cassava files
 if (!ret[0]?.length || ret[0][0] !== '0-cassava') {
  return {
   isCassava: false,
   data: ret,
   firstBodyRow: 0,
  }
 }

 // Handle cassava files
 const firstRow = ret.findIndex((row) => !row[0]?.startsWith('0'))
 if (firstRow === -1) {
  console.log('No data rows found in cassava file')
  return {
   isCassava: true,
   data: ret,
   firstBodyRow: ret.length,
  }
 }

 const body = ret.slice(firstRow)
 const rawHeaders = ret.slice(0, firstRow)
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

const padEnd = <T>(arr: T[], length: number, value: T): T[] => {
 return [...arr, ...Array(length - arr.length).fill(value)]
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
