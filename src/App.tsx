import Papa from 'papaparse'
import { useCallback, useRef, useState } from 'react'

function App() {
 const [isDragging, setIsDragging] = useState(false)
 const [data, setData] = useState<string[][]>([])
 const header = data.at(0)
 const fileInputRef = useRef<HTMLInputElement>(null)

 const handleDrag = useCallback((e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()

  if (e.type === 'dragenter' || e.type === 'dragover') {
   setIsDragging(true)
  } else if (e.type === 'dragleave' || e.type === 'drop') {
   setIsDragging(false)
  }
 }, [])

 const handleFile = useCallback((file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
   const csv = e.target?.result
   if (typeof csv === 'string') {
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
  }
  reader.readAsText(file)
 }, [])

 const handleDrop = useCallback(
  (e: React.DragEvent) => {
   e.preventDefault()
   e.stopPropagation()
   setIsDragging(false)

   const files = Array.from(e.dataTransfer.files)
   const csvFile = files.find((file) => file.name.endsWith('.csv'))
   if (csvFile) handleFile(csvFile)
  },
  [handleFile],
 )

 const handleFileSelect = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0]
   if (file?.name.endsWith('.csv')) handleFile(file)
  },
  [handleFile],
 )

 const handleCellEdit = useCallback(
  (rowIndex: number, colIndex: number, value: string) => {
   setData((prevData) => {
    const newData = [...prevData]
    newData[rowIndex] = [...newData[rowIndex]]
    newData[rowIndex][colIndex] = value
    return newData
   })
  },
  [],
 )

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
   className={`min-h-screen p-8 ${
    isDragging ? 'border-4 border-yellow-500/50 border-dashed' : ''
   }`}
   onDragEnter={handleDrag}
   onDragOver={handleDrag}
   onDragLeave={handleDrag}
   onDrop={handleDrop}
  >
   <h1 className="mb-8 text-3xl">Cassava</h1>

   {data.length > 0 ? (
    <div className="overflow-x-auto">
     <table className="w-full border-collapse">
      <tbody className="border-stone-600 border-t border-l">
       {data.map((row, i) => (
        <tr
         key={row[0] ?? i}
         className="border-stone-700 border-b hover:bg-stone-800/50"
        >
         {row.map((cell, j) => (
          <td
           key={header?.[j] ?? j}
           className="min-w-[100px] whitespace-nowrap border-stone-700 border-r p-2 focus:bg-stone-700 focus:shadow-[inset_0_0_0_2px] focus:shadow-yellow-500 focus:outline-none"
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
   ) : (
    <div className="flex flex-col items-center justify-center gap-2">
     <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileSelect}
      accept=".csv,.tsv"
      className="hidden"
      id="file-upload"
     />
     <label
      htmlFor="file-upload"
      className="duration- inline-block cursor-pointer rounded-lg border-2 border-yellow-500/50 bg-yellow-800 px-6 py-3 text-lg transition-colors hover:border-yellow-500/75 hover:bg-yellow-600 active:bg-yellow-500/40"
     >
      Upload a CSV or drag one here
     </label>
    </div>
   )}
  </div>
 )
}

export default App
