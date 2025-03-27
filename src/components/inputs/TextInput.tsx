import { twMerge } from 'tailwind-merge'

export const TextInput = (props: {
 value: string
 setValue: (value: string) => void
 nullDefault?: string
 type: 'text' | 'number'
}) => {
 const { value, setValue, nullDefault, type } = props
 return (
  <div
   // jank auto-resize. the ::before pseudo-element is used to set the width
   className={twMerge(
    "relative h-full p-2 before:invisible before:whitespace-pre-wrap before:content-[attr(data-value)_'']",
    type === 'number' && 'before:pr-4',
   )}
   data-value={value}
  >
   <input
    type={type}
    inputMode={type === 'text' ? 'text' : 'numeric'}
    value={value}
    onChange={(e) => setValue(e.target.value)}
    onClick={() => {
     if (value === '' && nullDefault != null) {
      setValue(nullDefault)
     }
    }}
    size={1}
    className="absolute inset-0 p-2 outline-none"
   />
  </div>
 )
}
