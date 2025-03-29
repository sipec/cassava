import { Plus } from 'lucide-react'
import Papa from 'papaparse'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { CellInput } from './components/CellInput'
import { Empty } from './components/Empty'
import { readFile, saveFile } from './lib/files'
import { THE_ORDER, parseCassava } from './lib/parser/cassava'
import type { ColumnType } from './lib/parser/types'
import {
 insertColumnBefore,
 insertRowBefore,
 moveColumn,
 moveRow,
} from './lib/table'

export default function App() {
 const [isCassava, setIsCassava] = useState(false)
 const [headers, setHeaders] = useState<string[][] | null>(null)
 const [rawData, setRawData] = useState<string[][]>([[]])
 const data = !isCassava ? rawData : rawData.map((row) => row.slice(1))
 const setData = (
  data: string[][] | ((prevData: string[][]) => string[][]),
 ) => {
  setRawData((raw) => {
   const inputData = !isCassava ? raw : raw.map((row) => row.slice(1))
   const output = typeof data === 'function' ? data(inputData) : data
   if (!isCassava) return output
   return output.map((row, i) => [(i + 1).toString(), ...row])
  })
 }

 const types = headers?.[THE_ORDER.indexOf('type')].slice(1) as
  | ColumnType[]
  | undefined
 const nullDefaults = headers?.[THE_ORDER.indexOf('null-default')].slice(1)

 const [selection, setSelection] = useState<Selection | null>(null)
 type Mode = 'visual' | 'edit' | 'command'
 const [mode, setMode] = useState<Mode>('visual')
 const [currentPath, setCurrentPath] = useState<string | null>(null)

 const [dropTarget, setDropTarget] = useState<number | null>(null)
 const [dragSource, setDragSource] = useState<{
  type: 'col' | 'row'
  index: number
 } | null>(null)

 async function handleFile(path: string) {
  setCurrentPath(path)
  const csv = await readFile(path)

  Papa.parse<string[]>(csv, {
   skipEmptyLines: true,
   complete: (results) => {
    const { headers, data, isCassava } = parseCassava(results.data)

    setHeaders(headers)
    setRawData(data)
    setIsCassava(isCassava)
   },
   error: (error: unknown) => {
    console.error('Error parsing CSV:', error)
   },
  })
 }

 useEffect(() => {
  if (!currentPath) return

  const onFocus = () => {
   handleFile(currentPath)
  }

  window.addEventListener('focus', onFocus)
  return () => {
   window.removeEventListener('focus', onFocus)
  }
 }, [currentPath])

 useEffect(() => {
  if (!currentPath) return

  const timeoutId = setTimeout(() => {
   let output: string[][]

   if (isCassava) {
    // Add back headers and line numbers
    output = [...(headers ?? []), ...rawData]
   } else {
    output = rawData
   }

   if (output.length) saveFile(currentPath, Papa.unparse(output))
  }, 1000)
  return () => clearTimeout(timeoutId)
 }, [rawData, currentPath, headers])

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

 function handleCellKeyDown(
  row: number,
  col: number,
  e: React.KeyboardEvent<HTMLTableCellElement>,
 ) {
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
      setData((prevData) => pasteSelection({ row, col, data: prevData, paste }))
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
  const elem = table?.querySelector(
   `tr:nth-of-type(${row + 1}) td:nth-of-type(${col + 1}) input`,
  ) as HTMLInputElement | null
  if (!elem) return
  elem.focus()
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

 return (
  <div
   data-dropzone
   className={twMerge(
    'flex h-screen w-screen flex-col justify-center bg-stone-800 text-white',
    // isDraggingFile && 'border-4 border-yellow-500/50 border-dashed',
   )}
   onDragEnd={() => {
    setDragSource(null)
    setDropTarget(null)
   }}
  >
   {currentPath != null ? (
    <>
     <div className="m-8 mb-1 flex justify-between">
      <NicePath>{currentPath}</NicePath>
      {/* toggle button for cassava mode */}
      <HoverButton
       className="-mt-2 w-fit grow-0 opacity-75"
       onClick={() => {
        setIsCassava(!isCassava)
       }}
      >
       {isCassava ? 'cassava' : 'csv'}
      </HoverButton>
     </div>
     <div className="relative min-h-0 grow overflow-auto">
      <table
       className="mx-8 grid w-fit border-collapse"
       style={{
        gridTemplateColumns: `0 repeat(${((headers || data)[0]?.length || 0) + 1}, max-content) max-content`,
        gridTemplateRows: `repeat(${data.length + 1}, max-content) max-content`,
       }}
       role="grid"
      >
       {Array.from({ length: (data[0]?.length || 0) + 1 }).map((_, j) => (
        <ColGridLine
         key={j}
         position={j}
         highlight={dragSource?.type === 'col' && dropTarget === j}
         onClickAdd={() => {
          setData((prev) => insertColumnBefore(prev, j))
          setHeaders((prev) => insertColumnBefore(prev || [], j + 1))
         }}
        />
       ))}

       <thead className="contents [writing-mode:vertical-rl]">
        <tr className="contents">
         <th scope="col">
          <span className="sr-only">#</span>
         </th>
         {(headers?.[0].slice(1) || Array(data[0]?.length || 0)).map(
          (title, j) => (
           <th
            key={title || j}
            scope="col"
            className="group/col sticky top-0 z-10 bg-stone-800"
            style={{ gridRowStart: 1, gridColumnStart: j + 2 }}
            draggable="true"
            onDragStart={(e) => {
             e.dataTransfer.effectAllowed = 'move'
             setDragSource({ type: 'col', index: j })

             e.dataTransfer.setData(
              'text/csv',
              Papa.unparse([
               ...(isCassava ? [] : (headers?.[j + 1] ?? [])),
               ...data.map((row) => [row[j]]),
              ]),
             )
            }}
            onDragEnter={(e) => e.preventDefault()}
            onDragOver={(e) => {
             e.preventDefault()
             e.dataTransfer.dropEffect = 'move'

             if (dragSource?.type === 'col') {
              const rect = e.currentTarget.getBoundingClientRect()
              const midpoint = rect.left + rect.width / 2
              const dropIndex = e.clientX < midpoint ? j : j + 1
              setDropTarget(dropIndex)
             }
            }}
            onDrop={(e) => {
             e.preventDefault()

             if (!dragSource || dragSource.type !== 'col') {
              return
             }

             const src = dragSource.index
             const target = dropTarget ?? j
             const dest = target <= src ? target : target - 1
             if (src === dest) return

             setData((prev) => moveColumn(prev, src, dest))
             setHeaders((prev) => prev && moveColumn(prev, src + 1, dest + 1))

             setDragSource(null)
            }}
           >
            <HoverButton
             className={twMerge(
              'items-start justify-end group-hover/row:opacity-100',
              title && 'opacity-75',
             )}
             onClick={() => selectColumn(j)}
            >
             <span>{title || letter(j)}</span>
            </HoverButton>
           </th>
          ),
         )}
        </tr>
       </thead>
       <tbody ref={tableRef} className="contents">
        {data.map((row, i) => (
         <tr key={i} className="group/row contents">
          <RowGridLine
           highlight={dragSource?.type === 'row' && dropTarget === i}
           position={i}
           onClickAdd={() => {
            setData((prev) => insertRowBefore(prev, i))
           }}
          />
          <th
           scope="row"
           className="sticky left-8 z-10 border-0 bg-stone-800"
           style={{ gridRowStart: i + 2, gridColumnStart: 1 }}
          >
           <div
            className="-translate-x-full flex h-full min-w-8 items-center gap-1 bg-stone-800"
            draggable="true"
            onDragStart={(e) => {
             e.dataTransfer.effectAllowed = 'move'
             setDragSource({ type: 'row', index: i })

             e.dataTransfer.setData('text/csv', Papa.unparse([data[i]]))
            }}
            onDragEnter={(e) => e.preventDefault()}
            onDragOver={(e) => {
             e.preventDefault()
             e.dataTransfer.dropEffect = 'move'

             if (dragSource?.type === 'row') {
              const rect = e.currentTarget.getBoundingClientRect()
              const midpoint = rect.top + rect.height / 2
              const dropIndex = e.clientY < midpoint ? i : i + 1
              setDropTarget(dropIndex)
             }
            }}
            onDrop={(e) => {
             e.preventDefault()

             if (!dragSource || dragSource.type !== 'row') {
              return
             }

             const src = dragSource.index
             const target = dropTarget ?? i
             const dest = target <= src ? target : target - 1
             if (src === dest) return

             setData((prev) => moveRow(prev, src, dest))

             setDragSource(null)
            }}
           >
            <HoverButton
             className="group-hover/row:opacity-100"
             onClick={() => selectRow(i)}
            >
             {i + 1}
            </HoverButton>
           </div>
          </th>

          {row.map((cell, j) => (
           <td
            key={headers?.[0][j] || j}
            className={twMerge(
             'min-h-[41px] min-w-[41px]',
             'cursor-default whitespace-nowrap tabular-nums shadow-yellow-500 outline-0 outline-yellow-300/50 focus-within:bg-stone-600 focus-within:shadow-[inset_0_0_0_2px]',
             selection && isCellInSelection(i, j, selection)
              ? 'bg-stone-600'
              : 'group-hover/row:bg-stone-700/10',
             mode === 'edit' && 'focus:outline-2',
            )}
            style={{ gridRowStart: i + 2, gridColumnStart: j + 2 }}
            onBlur={(e) => {
             if (e.relatedTarget?.parentElement?.tagName !== 'TD') {
              setMode('visual')
              setSelection(null)
             }
            }}
            onKeyDown={(e) => handleCellKeyDown(i, j, e)}
            onClick={() => {
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
            <CellInput
             value={cell}
             setValue={(value) => handleCellEdit(i, j, value)}
             nullDefault={nullDefaults?.[j]}
             type={(isCassava && types?.[j]) || 'string'}
            />
           </td>
          ))}
         </tr>
        ))}
        <RowGridLine
         highlight={dragSource?.type === 'row' && dropTarget === data.length}
         position={data.length}
         onClickAdd={() => {
          setData((prev) => insertRowBefore(prev, data.length))
         }}
        />
       </tbody>
      </table>
     </div>
    </>
   ) : (
    <Empty onSelectFile={handleFile} />
   )}
  </div>
 )
}

const ColGridLine = (props: {
 highlight: boolean
 position: number
 onClickAdd: () => void
}) => {
 const { highlight, position, onClickAdd } = props
 return (
  <div
   className={twMerge(
    '-ml-px relative z-20 h-full w-0 outline-1 outline-transparent has-hover:outline-yellow-500',
    highlight && 'outline-yellow-500',
   )}
   style={{
    gridRowStart: 1,
    gridRowEnd: -2,
    gridColumnStart: position + 2,
   }}
  >
   <button
    type="button"
    onClick={onClickAdd}
    className="-translate-x-1/2 absolute top-0 left-0 cursor-pointer bg-amber-500/50 p-px text-amber-200 opacity-0 transition-opacity hover:opacity-100"
   >
    <Plus size={24} />
   </button>
  </div>
 )
}

const RowGridLine = (props: {
 highlight: boolean
 position: number
 onClickAdd: () => void
}) => {
 const { highlight, position, onClickAdd } = props
 return (
  <div
   className={twMerge(
    '-mt-px relative z-20 h-0 w-full outline-1 outline-transparent has-hover:outline-yellow-500',
    highlight && 'outline-yellow-500',
   )}
   style={{
    gridColumnStart: 1,
    gridColumnEnd: -1,
    gridRowStart: position + 2,
   }}
  >
   <button
    type="button"
    onClick={onClickAdd}
    className="-translate-y-1/2 -translate-x-1/2 absolute top-0 left-0 cursor-pointer bg-amber-500/50 p-px text-amber-200 opacity-0 transition-opacity hover:opacity-100"
   >
    <Plus size={20} />
   </button>
  </div>
 )
}

function HoverButton(
 props: {
  className?: string
  children: React.ReactNode
  onClick: () => void
 } & React.HTMLAttributes<HTMLButtonElement>,
) {
 const { children, onClick, className, ...rest } = props
 return (
  <button
   type="button"
   className={twMerge(
    'flex h-full w-full grow cursor-pointer items-center justify-center self-center p-2 text-stone-500 opacity-20 transition-colors duration-150 hover:bg-stone-700 hover:text-stone-300 hover:opacity-100',
    className,
   )}
   onClick={onClick}
   {...rest}
  >
   {children}
  </button>
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

const letter = (col: number) => {
 let num = col
 let letters = ''
 while (num >= 0) {
  letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters
  num = Math.floor(num / 26) - 1
 }
 return letters
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
 for (let i = 0; i < paste.length && row + i < copy.length; i++) {
  if (!copy[row + i]) copy[row + i] = []
  for (let j = 0; j < paste[i].length; j++) {
   copy[row + i][col + j] = paste[i][j]
  }
 }
 return copy
}
