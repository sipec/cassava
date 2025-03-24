import { version } from 'react'
import { openFile } from '../lib/files'
import { tryCatch } from '../lib/utils'

export const Empty = (props: {
 onSelectFile: (path: string) => unknown
}) => {
 return (
  <div className="grid h-full w-full grid-rows-3 flex-col place-items-center justify-center gap-2 self-center text-center">
   <h1 className="text-2xl">
    cassava <span className="text-lg text-stone-500">v{version}</span>
   </h1>

   <button
    type="button"
    onClick={async () => {
     const { data: path, error } = await tryCatch(openFile())
     if (error) console.error(error)
     if (path) props.onSelectFile(path)
    }}
    className="w-full cursor-pointer rounded-lg border-2 border-yellow-800 bg-yellow-50 px-6 py-3 text-xl text-yellow-900 transition-colors hover:border-yellow-700 hover:bg-yellow-100 active:bg-yellow-100"
   >
    open a csv
   </button>
   <span className="text-stone-400">or drag and drop anywhere</span>
  </div>
 )
}
