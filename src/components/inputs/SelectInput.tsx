import {
 Combobox,
 ComboboxButton,
 ComboboxInput,
 ComboboxOption,
 ComboboxOptions,
} from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export const SelectInput = (props: {
 options: string[]
 value: string
 setValue: (value: string) => void
 nullDefault?: string
 // TODO: stricter types for options?
}) => {
 const { options, value, setValue, nullDefault } = props

 const [query, setQuery] = useState('')

 const filtered = !query
  ? options
  : options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))

 return (
  <Combobox
   as="div"
   value={value}
   onClick={() => {
    if (!value && nullDefault) setValue(nullDefault)
   }}
   onChange={(option) => {
    setQuery('')
    setValue(option || '')
   }}
   // jank auto-resize. the ::before pseudo-element is used to set the width
   className="relative flex h-full items-center before:invisible before:h-full before:whitespace-pre-wrap before:p-2 before:pr-12 before:content-[attr(data-value)_'']"
   data-value={value}
  >
   <ComboboxInput
    className="absolute inset-0 p-2 pr-12 outline-none placeholder:text-stone-400"
    onChange={(e) => setQuery(e.target.value)}
    onBlur={() => setQuery('')}
   />
   <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-2 text-stone-400 hover:text-white focus:outline-none">
    <ChevronDown size={5 * 4} aria-hidden="true" />
   </ComboboxButton>

   {filtered.length > 0 && (
    <ComboboxOptions className="-mt-1 absolute top-full z-10 ml-1 max-h-60 w-fit min-w-full overflow-auto bg-stone-900 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
     {filtered.map((value) => (
      <ComboboxOption
       key={value}
       value={value}
       className="group relative cursor-default select-none px-3 py-2 text-stone-200 active:bg-amber-800 data-[focus]:bg-amber-600! data-[selected]:bg-amber-800 data-[focus]:text-white data-[selected]:text-white data-[focus]:outline-none"
      >
       <span className="block truncate">{value}</span>
      </ComboboxOption>
     ))}
    </ComboboxOptions>
   )}
  </Combobox>
 )
}
