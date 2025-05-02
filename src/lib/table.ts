import { produce } from 'immer'

export function insertColumnBefore(
 data: string[][],
 index: number,
): string[][] {
 return produce(data, (draft) => {
  for (const row of draft) {
   row.splice(index, 0, '')
  }
 })
}

export function moveColumn(
 data: string[][],
 srcIndex: number,
 destIndex: number,
): string[][] {
 if (srcIndex === destIndex) return data
 return produce(data, (draft) => {
  for (const row of draft) {
   let j = srcIndex
   while (j < destIndex) swap(row, j, ++j)
   while (j > destIndex) swap(row, j, --j)
  }
 })
}

export function deleteColumns(
 data: string[][],
 indexLo: number,
 indexHi: number,
): string[][] {
 return produce(data, (draft) => {
  for (const row of draft) {
   row.splice(indexLo, indexHi - indexLo + 1)
  }
 })
}

export function insertRowBefore(data: string[][], index: number): string[][] {
 return produce(data, (draft) => {
  draft.splice(index, 0, Array(data[0]?.length || 0).fill(''))
 })
}

export function moveRow(
 data: string[][],
 srcIndex: number,
 destIndex: number,
): string[][] {
 if (srcIndex === destIndex) return data
 return produce(data, (draft) => {
  let i = srcIndex
  while (i < destIndex) swap(draft, i, ++i)
  while (i > destIndex) swap(draft, i, --i)
 })
}

export function deleteRows(
 data: string[][],
 indexLo: number,
 indexHi: number,
): string[][] {
 return produce(data, (draft) => {
  draft.splice(indexLo, indexHi - indexLo + 1)
 })
}

const swap = <T>(arr: T[], a: number, b: number) => {
 ;[arr[a], arr[b]] = [arr[b], arr[a]]
}
