export function insertColumnBefore(
 data: string[][],
 index: number,
): string[][] {
 return data.map((row) => {
  const newRow = [...row]
  newRow.splice(index, 0, '')
  return newRow
 })
}

export function moveColumn(
 data: string[][],
 srcIndex: number,
 destIndex: number,
): string[][] {
 if (srcIndex === destIndex) return data
 return data.map((row) => {
  const newRow = [...row]
  const [col] = newRow.splice(srcIndex, 1)
  newRow.splice(destIndex, 0, col)
  return newRow
 })
}

export function deleteColumn(data: string[][], index: number): string[][] {
 return data.map((row) => {
  const newRow = [...row]
  newRow.splice(index, 1)
  return newRow
 })
}

export function insertRowBefore(data: string[][], index: number): string[][] {
 const newData = [...data]
 const width = Math.max(...data.map((row) => row.length))
 newData.splice(index, 0, Array(width).fill(''))
 return newData
}

export function moveRow(
 data: string[][],
 srcIndex: number,
 destIndex: number,
): string[][] {
 if (srcIndex === destIndex) return data
 const newData = [...data]
 const [row] = newData.splice(srcIndex, 1)
 newData.splice(destIndex, 0, row)
 return newData
}

export const deleteRow = (data: string[][], index: number): string[][] => {
 const newData = [...data]
 newData.splice(index, 1)
 return newData
}
