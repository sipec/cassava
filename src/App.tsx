import Papa from 'papaparse'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { Empty } from './components/Empty'
import { readFile, saveFile } from './lib/files'

function HoverButton(props: {
 className?: string
 children: React.ReactNode
 onClick: () => void
}) {
 return (
  <button
   type="button"
   className={twMerge(
    'flex h-full w-full grow cursor-pointer items-center justify-center self-center p-1 text-2xl text-stone-300 opacity-0 transition-all duration-150 hover:bg-stone-700 hover:opacity-100',
    props.className,
   )}
   onClick={props.onClick}
  >
   {props.children}
  </button>
 )
}

export default function App() {
 const [isDragging, setIsDragging] = useState(false)
 const [data, setData] = useState<string[][]>([])
 const [selection, setSelection] = useState<Selection | null>(null)
 type Mode = 'visual' | 'edit' | 'command'
 const [mode, setMode] = useState<Mode>('visual')
 const [currentPath, setCurrentPath] = useState<string | null>(null)
 const header = data.at(0)

 function handleDrag(e: React.DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (e.type === 'dragenter' || e.type === 'dragover') {
   setIsDragging(true)
  } else if (e.type === 'dragleave' || e.type === 'drop') {
   setIsDragging(false)
  }
 }

 async function handleFile(path: string) {
  setCurrentPath(path)
  const csv = await readFile(path)

  Papa.parse<string[]>(csv, {
   complete: (results) => {
    setData(results.data)
   },
   error: (error: unknown) => {
    console.error('Error parsing CSV:', error)
    // TODO: Add proper error handling UI
   },
  })
 }

 function handleDrop(_e: React.DragEvent) {
  setIsDragging(false)
  // TODO: Handle files
 }

 function handleCellEdit(row: number, col: number, value: string) {
  if (row < 0 || col < 0 || Number.isNaN(row) || Number.isNaN(col)) {
   console.error('Invalid row or column:', row, col)
   return
  }

  setData((prevData) => {
   const newData = structuredClone(prevData)
   if (value && !newData[row]) newData[row] = []
   if (value || newData[row]?.[col] != null) newData[row][col] = value
   return newData
  })
 }

 function handleCellKeyDown(e: React.KeyboardEvent<HTMLTableCellElement>) {
  const td = e.currentTarget
  const tr = td.parentElement
  if (!tr) return

  const row = Array.from(tr.parentElement?.children || []).indexOf(tr)
  const col = Array.from(tr.children).indexOf(td)

  const navigate = (newRow: number, newCol: number) => {
   e.preventDefault()

   if (newCol < 0) {
    return navigate(newRow - 1, data[newRow - 1]?.length - 1)
   }

   if (newRow < 0) return

   createCellIfMissing(newRow, newCol)

   if (e.shiftKey) {
    setSelection((prev) => ({
     start: prev?.start || { row, col },
     end: { row: newRow, col: newCol },
    }))
   } else {
    setSelection({
     start: { row: newRow, col: newCol },
     end: { row: newRow, col: newCol },
    })
   }

   setMode('visual')

   requestAnimationFrame(() => {
    focusCell(newRow, newCol)
   })
  }

  switch (e.key) {
   case 'X':
   case 'C':
    if ((e.metaKey || e.ctrlKey) && selection && !isSingular(selection)) {
     e.preventDefault()
     const { rowLo, rowHi, colLo, colHi } = getBounds(selection)
     const copy = data.slice(rowLo, rowHi + 1).map((row) => {
      row.slice(colLo, colHi + 1)
     })

     navigator.clipboard.writeText(Papa.unparse(copy))
     if (e.key === 'X') {
      setData((data) => deleteSelection({ selection, data }))
     }
    }

    break

   case 'V':
    if (e.metaKey || e.ctrlKey) {
     ;(async () => {
      const text = await navigator.clipboard.readText()
      const paste = Papa.parse<string[]>(text, {
       header: false,
       skipEmptyLines: true,
      }).data
      if (paste.length === 0) return

      e.preventDefault()
      const { row, col } = selection?.start || { row: 0, col: 0 }
      pasteSelection({ row, col, data, paste })
     })()
    }
    break

   case 'Escape':
    e.preventDefault()
    if (mode !== 'visual') setMode('visual')
    else setSelection(null)
    break
   case 'Home':
    if (e.metaKey) navigate(0, col)
    else navigate(0, 0)
    break
   case 'End':
    if (e.metaKey) navigate(data.length - 1, col)
    else navigate(data.length - 1, data[data.length - 1].length - 1)
    break
   case 'ArrowUp':
    if (e.metaKey) navigate(0, col)
    else if (mode === 'visual') navigate(row - 1, col)
    break
   case 'ArrowDown':
    if (e.metaKey) navigate(data.length - 1, col)
    else if (mode === 'visual') navigate(row + 1, col)
    break
   case 'ArrowLeft':
    if (e.metaKey) navigate(row, 0)
    else if (mode === 'visual') navigate(row, col - 1)
    break
   case 'ArrowRight':
    if (e.metaKey) navigate(row, data[row].length - 1)
    else if (mode === 'visual') navigate(row, col + 1)
    break
   case 'Tab':
    if (e.shiftKey) navigate(row, col - 1)
    else navigate(row, col + 1)
    break
   case 'Enter':
    if (!e.shiftKey) {
     navigate(row + 1, col)
    }
    break
   case 'Backspace':
   case 'Clear':
    if (selection && !isSingular(selection)) {
     // delete selection
     setData((data) => deleteSelection({ selection, data }))
    } else if (e.metaKey) {
     // delete row
     setData((prevData) => {
      const newData = structuredClone(prevData)
      newData.splice(row, 1)
      return newData
     })
     navigate(row - 1, data[row - 1]?.length - 1)
    } else if (e.altKey) {
     // hard delete cell if it's at the end of the row.
     setData((prevData) => {
      const newData = structuredClone(prevData)
      const newRow = newData[row]
      if (newRow) {
       if (col >= newRow.length - 1) {
        newRow.splice(col, 1)
       } else {
        newRow[col] = ''
       }
      }
      // check if we deleted the last item in this row
      if (newRow && newRow.length === 0) {
       newData.splice(row, 1)
      }

      return newData
     })
     navigate(row, col - 1)
    }
    break
  }
 }

 function createCellIfMissing(newRow: number, newCol: number) {
  if (data[newRow] == null || data[newRow][newCol] == null) {
   setData((prevData) => {
    const newData = structuredClone(prevData)
    while (newData[newRow] == null) newData.push([])
    const row = newData[newRow]
    while (row[newCol] == null) row.push('')
    return newData
   })
  }
 }

 const tableRef = useRef<HTMLTableSectionElement>(null)

 function focusCell(row: number, col: number) {
  const table = tableRef.current
  const td = table?.querySelector(
   `tr:nth-child(${row + 1}) td:nth-child(${col + 1})`,
  ) as HTMLTableCellElement | null
  if (!td) return
  td.focus()
 }

 function getCellClassName(row: number, col: number) {
  const isSelected = selection && isCellInSelection(row, col, selection)
  return twMerge(
   'min-w-[100px] whitespace-nowrap border border-stone-700 p-2',
   'shadow-yellow-500 outline-0 outline-yellow-300/50 focus:bg-stone-600 focus:shadow-[inset_0_0_0_2px]',
   'cursor-default tabular-nums',
   isSelected && 'bg-stone-600',
   mode === 'edit' && 'focus:outline-2',
  )
 }

 function selectColumn(col: number) {
  setSelection({
   start: { row: 0, col },
   end: { row: data.length - 1, col },
  })
  setMode('visual')
 }

 function selectRow(row: number) {
  setSelection({
   start: { row, col: 0 },
   end: { row, col: data[row].length - 1 },
  })
  setMode('visual')
 }

 useEffect(() => {
  if (currentPath && data) {
   const timeoutId = setTimeout(() => {
    saveFile(currentPath, Papa.unparse(data))
   }, 1000)
   return () => clearTimeout(timeoutId)
  }
 }, [data, currentPath])

 return (
  <div
   data-dropzone
   className={twMerge(
    'flex min-h-screen flex-col justify-center bg-stone-800 p-8 text-white',
    isDragging && 'border-4 border-yellow-500/50 border-dashed',
   )}
   onDragEnter={handleDrag}
   onDragOver={handleDrag}
   onDragLeave={handleDrag}
   onDrop={handleDrop}
  >
   {currentPath != null ? (
    <>
     <NicePath className="mb-8">{currentPath}</NicePath>
     <div className="grow overflow-auto">
      <table className="w-full border-collapse">
       <tbody ref={tableRef}>
        {data.map((row, i) => (
         <tr key={row[0] || i} className="hover:bg-stone-700/10">
          {row.map((cell, j) => (
           <td
            key={header?.[j] || j}
            className={twMerge(
             getCellClassName(i, j),
             i === 0 && 'group/col relative',
            )}
            contentEditable={true}
            suppressContentEditableWarning
            onBlur={(e) => {
             handleCellEdit(i, j, e.currentTarget.textContent || '')
             if (e.relatedTarget?.tagName !== 'TD') {
              setMode('visual')
              setSelection(null)
             }
            }}
            onKeyDown={handleCellKeyDown}
            onFocus={(e) => {
             // select all text on focus
             const selection = window.getSelection()
             const range = document.createRange()
             range.selectNodeContents(e.currentTarget)
             selection?.removeAllRanges()
             selection?.addRange(range)
            }}
            onClick={() => {
             // if already selected
             if (
              selection &&
              selection.start.row === i &&
              selection.start.col === j
             ) {
              setMode('edit')
             } else {
              setMode('visual')
             }

             setSelection({
              start: { row: i, col: j },
              end: { row: i, col: j },
             })
             focusCell(i, j)
            }}
           >
            {cell}
           </td>
          ))}
          <HoverButton
           onClick={() => {
            const j = row.length
            createCellIfMissing(i, j)
            requestAnimationFrame(() => focusCell(i, j))
           }}
          >
           +
          </HoverButton>
         </tr>
        ))}
        <tr>
         {data[data.length - 1]?.map((_, j) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <td key={j}>
           <HoverButton
            onClick={() => {
             const i = data.length
             createCellIfMissing(i, j)
             requestAnimationFrame(() => focusCell(i, j))
            }}
           >
            +
           </HoverButton>
          </td>
         ))}
        </tr>
       </tbody>
      </table>
     </div>
    </>
   ) : (
    <Empty onSelectFile={handleFile} />
   )}
   {DEBUG && (
    <div className="flex gap-2">
     {mode}
     <pre>{JSON.stringify(selection)}</pre>
    </div>
   )}
  </div>
 )
}

const NicePath = (props: { className?: string; children: string }) => {
 const parts = props.children.split('/')
 const name = parts.pop()
 return (
  <div className={twMerge('text-stone-400', props.className)}>
   {parts.flatMap((part) => [
    part,
    // biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
    <span className="mx-1 text-stone-600">/</span>,
   ])}
   <span className="text-stone-100">{name}</span>
  </div>
 )
}

type Selection = {
 start: { row: number; col: number }
 end: { row: number; col: number }
}

const isSingular = (selection: Selection) => {
 return (
  selection.start.row === selection.end.row &&
  selection.start.col === selection.end.col
 )
}

const getBounds = (selection: Selection) => {
 const [rowLo, rowHi] = [selection.start.row, selection.end.row].sort()
 const [colLo, colHi] = [selection.start.col, selection.end.col].sort()
 return { rowLo, rowHi, colLo, colHi }
}

function isCellInSelection(row: number, col: number, sel: Selection): boolean {
 const { rowLo, rowHi, colLo, colHi } = getBounds(sel)
 return row >= rowLo && row <= rowHi && col >= colLo && col <= colHi
}

const deleteSelection = (props: { selection: Selection; data: string[][] }) => {
 const { selection, data } = props
 const { rowLo, rowHi, colLo, colHi } = getBounds(selection)
 const copy = structuredClone(data)
 for (let i = rowLo; i <= rowHi; i++) {
  copy[i].splice(colLo, colHi - colLo + 1, ...Array(colHi - colLo + 1).fill(''))
 }
 return copy
}

const pasteSelection = (props: {
 row: number
 col: number
 data: string[][]
 paste: string[][]
}) => {
 const { row, col, data, paste } = props
 const copy = structuredClone(data)
 for (let i = row; i < paste.length; i++) {
  copy[i].splice(col, paste[i].length, ...paste[i])
 }
}

const DEBUG = true
