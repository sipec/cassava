import { produce } from 'immer'

export type Selection = {
 start: { row: number; col: number }
 end: { row: number; col: number }
}

export const isSingular = (selection: Selection) => {
 return (
  selection.start.row === selection.end.row &&
  selection.start.col === selection.end.col
 )
}

export const getBounds = (selection: Selection) => {
 const [rowLo, rowHi] = [selection.start.row, selection.end.row].sort()
 const [colLo, colHi] = [selection.start.col, selection.end.col].sort()
 return { rowLo, rowHi, colLo, colHi }
}

export const isCellInSelection = (
 row: number,
 col: number,
 sel: Selection | null,
) => {
 return (
  !!sel &&
  ((row >= sel.start.row && row <= sel.end.row) ||
   (row >= sel.end.row && row <= sel.start.row)) &&
  ((col >= sel.start.col && col <= sel.end.col) ||
   (col >= sel.end.col && col <= sel.start.col))
 )
}

export const getSelectionData = (data: string[][], selection: Selection) => {
 const { rowLo, rowHi, colLo, colHi } = getBounds(selection)
 return data.slice(rowLo, rowHi + 1).map((row) => row.slice(colLo, colHi + 1))
}

export const clearSelection = (props: {
 selection: Selection
 data: string[][]
}) => {
 const { selection, data } = props
 const { rowLo, rowHi, colLo, colHi } = getBounds(selection)

 return produce(data, (draft) => {
  for (let i = rowLo; i <= rowHi; i++)
   for (let j = colLo; j <= colHi; j++)
    if (draft[i]?.[j] != null) draft[i][j] = ''
 })
}

export const pasteSelection = (props: {
 row: number
 col: number
 data: string[][]
 paste: string[][]
}) => {
 const { row, col, data, paste } = props

 return produce(data, (draft) => {
  for (let i = 0; i < paste.length; i++) {
   if (!draft[row + i]) break
   for (let j = 0; j < paste[i].length; j++) {
    draft[row + i][col + j] = paste[i][j]
   }
  }
 })
}
