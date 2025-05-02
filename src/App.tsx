import { produce } from 'immer'
import { Plus } from 'lucide-react'
import Papa from 'papaparse'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { CellInput } from './components/CellInput'
import { Empty } from './components/Empty'
import { readFile, saveFile } from './lib/files'
import { setFormulaSheet } from './lib/formulas'
import { THE_ORDER, parseCassava } from './lib/parser/cassava'
import { parseColumnType } from './lib/parser/types'
import {
 type Selection,
 clearSelection,
 deleteSelection,
 isCellInSelection,
 isSingular,
 pasteSelection,
} from './lib/selection'
import {
 insertColumnBefore,
 insertRowBefore,
 moveColumn,
 moveRow,
} from './lib/table'

export default function App() {
 const [isCassava, setIsCassava] = useState(false)
 const [firstBodyRow, setFirstBodyRow] = useState(0)
 const [data, setData] = useState<string[][]>([[]])
 const [displayData, setDisplayData] = useState<string[][]>([[]])
 const headers = data.slice(0, firstBodyRow)

 const displayCols = <T,>(arr: T[]) => (isCassava ? arr.slice(1) : arr)
 const displayRows = <T,>(arr: T[]) =>
  isCassava ? arr.slice(firstBodyRow) : arr

 const types = headers?.[THE_ORDER.indexOf('type')] as ColumnType[] | undefined
 const nullDefaults = headers?.[THE_ORDER.indexOf('null-default')]

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
    const { isCassava, data, firstBodyRow } = parseCassava(results.data)
    setIsCassava(isCassava)
    setData(data)
    setFirstBodyRow(firstBodyRow)

    // Load into HyperFormula
    setDisplayData(setFormulaSheet(path, data))
   },
   error: (error: unknown) => {
    console.error('Error parsing CSV:', error)
   },
  })
 }

 useEffect(() => {
  const onFocus = () => {
   if (currentPath) handleFile(currentPath)
  }

  window.addEventListener('focus', onFocus)
  return () => {
   window.removeEventListener('focus', onFocus)
  }
 }, [])

 useEffect(() => {
  if (!currentPath) return

  const timeoutId = setTimeout(() => {
   if (data.length) saveFile(currentPath, Papa.unparse(data))
  }, 1000)
  return () => clearTimeout(timeoutId)
 }, [data, currentPath, headers])

 useEffect(() => {
  if (mode !== 'edit' && currentPath) {
   setDisplayData(setFormulaSheet(currentPath, data))
  }
 }, [mode, currentPath, data])

 function handleCellEdit(row: number, col: number, value: string) {
  if (row < 0 || col < 0 || Number.isNaN(row) || Number.isNaN(col)) {
   console.error('Invalid row or column:', row, col)
   return
  }

  setData(
   produce((draft) => {
    draft[row] ??= []
    draft[row][col] = value
   }),
  )
 }

 function handleCellKeyDown(
  row: number,
  col: number,
  e: React.KeyboardEvent<HTMLTableCellElement>,
 ) {
  const navigate = (
   newRow: number,
   newCol: number,
   create?: 'row' | 'col' | null,
  ) => {
   e.preventDefault()

   if (newCol < 0) {
    return navigate(newRow - 1, data[newRow - 1]?.length - 1)
   }

   if (newRow < 0) return

   if (create) createCellIfMissing(newRow, newCol, create)
   else if (newRow > data.length - 1 || newCol > data[newRow].length - 1) return

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
    getCellInputAt(newRow, newCol)?.focus()
   })
  }

  switch (e.key) {
   case 'X':
   case 'C':
    if ((e.metaKey || e.ctrlKey) && selection && !isSingular(selection)) {
     e.preventDefault()

     if (e.key === 'X') {
      setData((data) => clearSelection({ selection, data }))
     }
     // TODO: copy
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
    else navigate(row, col + 1, 'col')
    break
   case 'Enter':
    if (!e.shiftKey) {
     navigate(row + 1, col, 'row')
    }
    break
   case 'Backspace':
   case 'Clear':
    if (selection && mode === 'visual' && !(e.metaKey || e.ctrlKey)) {
     setData((data) => clearSelection({ selection, data }))
     if (isSingular(selection)) navigate(row, col - 1)
    }
    break
  }
 }

 function createCellIfMissing(
  newRow: number,
  newCol: number,
  create: 'row' | 'col',
 ) {
  if (create === 'row' && data[newRow] == null) {
   setData((data) => insertRowBefore(data, newRow))
  }
  if (create === 'col' && data[newRow]?.[newCol] == null) {
   setData((data) => insertColumnBefore(data, newCol))
  }
 }

 const tableRef = useRef<HTMLTableSectionElement>(null)

 function getCellInputAt(row: number, col: number) {
  return tableRef.current?.querySelector(
   `[data-row="${row}"][data-col="${col}"] input`,
  ) as HTMLInputElement | null
 }

 function selectColumn(col: number) {
  setSelection({
   start: { row: -1, col },
   end: { row: data.length - 1, col },
  })
  setMode('visual')
 }

 function selectRow(row: number) {
  setSelection({
   start: { row, col: -1 },
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
       className="mx-8 grid w-fit border-collapse pr-[calc(100vw-8rem)] pb-[calc(100vh-8rem)]"
       style={{
        gridTemplateColumns: `0 repeat(${((headers || data)[0]?.length || 0) + 1}, max-content) max-content`,
        gridTemplateRows: `repeat(${data.length + 1}, max-content) max-content`,
       }}
       role="grid"
       onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
         setMode('visual')
         setSelection(null)
        }
       }}
       onKeyDown={(e) => {
        switch (e.key) {
         case 'Escape':
          e.preventDefault()
          if (mode !== 'visual') setMode('visual')
          else setSelection(null)
          break
         case 'Backspace':
         case 'Clear':
          if (selection) {
           setData((data) => {
            const newData = deleteSelection({ selection, data })
            if (newData !== data) {
             setSelection(null)
             return newData
            }
            if (mode !== 'edit') {
             return clearSelection({ selection, data })
            }
            return data
           })
          }

          break
        }
       }}
      >
       {displayCols(
        Array.from({ length: (data[0]?.length || 0) + 1 }).map((_, j) => (
         <ColGridLine
          key={j}
          position={j}
          highlight={dragSource?.type === 'col' && dropTarget === j}
          onClickAdd={() => setData((prev) => insertColumnBefore(prev, j))}
         />
        )),
       )}

       <thead
        className={twMerge(
         'contents',
         isCassava && '[writing-mode:vertical-rl]',
        )}
       >
        <tr className="contents">
         <th
          scope="col"
          className="sticky top-0 left-8 z-20 h-full w-full items-end"
          style={{ gridRowStart: 1, gridColumnStart: 1 }}
         >
          <div className="h-full min-w-8 bg-stone-800" />
         </th>
         {displayCols(
          (headers?.[0] || Array(data[0]?.length || 0)).map((title, j) => (
           <th
            key={j}
            scope="col"
            className="group/col sticky top-0 z-10 bg-stone-800"
            style={{ gridRowStart: 1, gridColumnStart: j + 2 }}
            draggable="true"
            onDragStart={(e) => {
             e.dataTransfer.effectAllowed = 'move'
             setDragSource({ type: 'col', index: j })

             e.dataTransfer.setData('text/csv', Papa.unparse(data))
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

             setDragSource(null)
            }}
           >
            <HoverButton
             className={twMerge(
              'items-start group-hover/row:opacity-100',
              isCassava ? 'items-end justify-end' : 'justify-start',
              title && 'opacity-75',
             )}
             aria-selected={!!selection && isCellInSelection(-1, j, selection)}
             onClick={(e) => {
              e.currentTarget.focus()
              selectColumn(j)
             }}
            >
             <span className="sticky left-8">
              {(isCassava && title) || letter(j)}
             </span>
            </HoverButton>
           </th>
          )),
         )}
        </tr>
       </thead>
       <tbody ref={tableRef} className="contents">
        {displayRows(
         data.map((row, i) => (
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
              onClick={(e) => {
               e.currentTarget.focus()
               selectRow(i)
              }}
              aria-selected={!!selection && isCellInSelection(i, -1, selection)}
             >
              {Math.max(0, i - firstBodyRow + 1)}
             </HoverButton>
            </div>
           </th>

           {displayCols(
            row.map((cell, j) => (
             <td
              key={j}
              className={twMerge(
               'min-h-[41px] min-w-[41px]',
               'cursor-default whitespace-nowrap tabular-nums shadow-yellow-500 outline-0 outline-yellow-300/50 focus-within:bg-stone-600 focus-within:shadow-[inset_0_0_0_2px]',
               'group-hover/row:bg-stone-700/10 aria-selected:bg-stone-600',
               mode === 'edit' && 'focus-within:outline-2',
               !isCassava &&
                i < firstBodyRow &&
                (i === 0 ? 'font-bold' : 'italic'),
              )}
              data-row={i}
              data-col={j}
              role="gridcell"
              aria-selected={!!selection && isCellInSelection(i, j, selection)}
              style={{ gridRowStart: i + 2, gridColumnStart: j + 2 }}
              onKeyDown={(e) => handleCellKeyDown(i, j, e)}
              onInput={() => setMode('edit')}
              onClick={(e) => {
               if (
                !e.shiftKey &&
                !e.ctrlKey &&
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
              }}
             >
              <CellInput
               value={
                isCassava &&
                parseColumnType(types?.[j]) === 'formula' &&
                // not focused
                (!selection ||
                 selection.end.row !== i ||
                 selection.end.col !== j)
                 ? (displayData[i]?.[j]?.toString() ?? '')
                 : cell
               }
               setValue={(value) => handleCellEdit(i, j, value)}
               nullDefault={nullDefaults?.[j]}
               type={(isCassava && types?.[j]) || 'text'}
              />
             </td>
            )),
           )}
          </tr>
         )),
        )}
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

function HoverButton(props: React.HTMLAttributes<HTMLButtonElement>) {
 const { children, className, ...rest } = props
 return (
  <button
   type="button"
   className={twMerge(
    'flex h-full w-full grow cursor-pointer items-center justify-center self-center p-2 text-stone-500 opacity-20 shadow-yellow-500 outline-0 transition-colors duration-150 hover:bg-stone-700 hover:text-stone-300 hover:opacity-100 focus-visible:shadow-[inset_0_0_0_2px] aria-selected:bg-stone-700',
    className,
   )}
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
