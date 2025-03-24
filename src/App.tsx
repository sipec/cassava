import Papa from 'papaparse'
import { useCallback, useEffect, useState } from 'react'
import { Empty } from './components/Empty'
import { readFile, saveFile } from './lib/files'

export default function App() {
 const [isDragging, setIsDragging] = useState(false)
 const [data, setData] = useState<string[][]>([])
 const dataWithAffordances = data
  .map((row) => [...row, ''])
  .concat([Array((data[0]?.length || 0) + 1).fill('')])

 const [currentPath, setCurrentPath] = useState<string | null>(null)
 const header = data.at(0)

 const handleDrag = useCallback((e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()

  if (e.type === 'dragenter' || e.type === 'dragover') {
   setIsDragging(true)
  } else if (e.type === 'dragleave' || e.type === 'drop') {
   setIsDragging(false)
  }
 }, [])

 const handleFile = useCallback(async (path: string) => {
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
 }, [])

 const handleDrop = useCallback((_e: React.DragEvent) => {
  setIsDragging(false)
  // TODO: Handle files
 }, [])

 const handleCellEdit = useCallback(
  (row: number, col: number, value: string) => {
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
  },
  [],
 )

 useEffect(() => {
  if (currentPath && data) {
   // Debounce
   const timeoutId = setTimeout(() => {
    saveFile(currentPath, Papa.unparse(data))
   }, 1000)
   return () => clearTimeout(timeoutId)
  }
 }, [data, currentPath, saveFile])

 const handleCellKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLTableCellElement>) => {
   if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    ;(e.target as HTMLElement).blur()
   }
  },
  [],
 )

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
       <tbody>
        {dataWithAffordances.map((row, i) => (
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
