import Papa from 'papaparse'
import { useEffect, useRef, useState } from 'react'
import { Empty } from './components/Empty'
import { readFile, saveFile } from './lib/files'

export default function App() {
 const [isDragging, setIsDragging] = useState(false)
 const [data, setData] = useState<string[][]>([])
 const [currentCell, setCurrentCell] = useState<{
  row: number
  col: number
 } | null>(null)
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
    // navigate to end of previous row
    return navigate(newRow - 1, data[newRow - 1]?.length - 1)
   }

   if (newRow < 0) return

   // Expand grid if needed
   if (data[newRow] == null || data[newRow][newCol] == null) {
    setData((prevData) => {
     const newData = structuredClone(prevData)

     // Add new rows if needed
     while (newData[newRow] == null) {
      newData.push([])
     }

     // Add new columns if needed
     const row = newData[newRow]
     while (row[newCol] == null) {
      row.push('')
     }

     return newData
    })
    console.log('expanded')
   }

   // ensure DOM is updated before focusing
   requestAnimationFrame(() => {
    focusCell(newRow, newCol)
   })
  }

  switch (e.key) {
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
    else navigate(row - 1, col)
    break
   case 'ArrowDown':
    if (e.metaKey) navigate(data.length - 1, col)
    else navigate(row + 1, col)
    break
   case 'ArrowLeft':
    if (e.metaKey) navigate(row, 0)
    else navigate(row, col - 1)
    break
   case 'ArrowRight':
   case 'Tab':
    if (e.metaKey) navigate(row, data[row].length - 1)
    else navigate(row, col + 1)
    break
   case 'Enter':
    if (!e.shiftKey) {
     navigate(row + 1, col)
    }
    break
   case 'Backspace':
   case 'Clear':
    if (e.metaKey) {
     // delete row
     setData((prevData) => {
      const newData = structuredClone(prevData)
      newData.splice(row, 1)
      return newData
     })
     navigate(row - 1, data[row - 1]?.length - 1)
    } else if (e.altKey) {
     // delete cell if it's at the end of the row. otherwise set empty
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

 const tableRef = useRef<HTMLTableSectionElement>(null)

 function focusCell(row: number, col: number) {
  const table = tableRef.current
  const td = table?.querySelector(
   `tr:nth-child(${row + 1}) td:nth-child(${col + 1})`,
  ) as HTMLTableCellElement | null
  if (!td) return
  td.focus()
 }

 useEffect(() => {
  if (currentPath && data) {
   // Debounce
   const timeoutId = setTimeout(() => {
    saveFile(currentPath, Papa.unparse(data))
   }, 1000)
   return () => clearTimeout(timeoutId)
  }
 }, [data, currentPath])

 return (
  <div
   data-dropzone
   className={`flex min-h-screen flex-col justify-center bg-stone-800 p-8 text-white ${
    isDragging ? 'border-4 border-yellow-500/50 border-dashed' : ''
   }`}
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
         <tr key={row[0] || i} className="hover:bg-stone-800">
          {row.map((cell, j) => (
           <td
            key={header?.[j] || j}
            className="min-w-[100px] whitespace-nowrap border border-stone-700 p-2 focus:bg-stone-700 focus:shadow-[inset_0_0_0_2px] focus:shadow-yellow-500 focus:outline-none"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
             handleCellEdit(i, j, e.currentTarget.textContent || '')
            }
            onKeyDown={handleCellKeyDown}
            onFocus={(e) => {
             const selection = window.getSelection()
             const range = document.createRange()
             range.selectNodeContents(e.currentTarget)
             range.collapse(false)
             selection?.removeAllRanges()
             selection?.addRange(range)
            }}
           >
            {cell}
           </td>
          ))}
         </tr>
        ))}
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

const NicePath = (props: { className?: string; children: string }) => {
 const parts = props.children.split('/')
 const name = parts.pop()
 return (
  <div className={`text-stone-400 ${props.className}`}>
   {parts.flatMap((part) => [
    part,
    // biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
    <span className="mx-1 text-stone-600">/</span>,
   ])}
   <span className="text-stone-100">{name}</span>
  </div>
 )
}
