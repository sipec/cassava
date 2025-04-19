import { useEffect, useRef } from 'react'

export const Checkbox = (props: {
 checked: true | false | null
 nullDefault?: true | false
 onChange: (checked: true | false | null) => void
}) => {
 const { checked, nullDefault, onChange } = props

 const ref = useRef<HTMLInputElement>(null)
 useEffect(() => {
  if (ref.current) {
   ref.current.indeterminate = checked === null
  }
 }, [checked])

 return (
  <div className="group grid h-full w-full">
   <input
    ref={ref}
    type="checkbox"
    checked={!!checked}
    onChange={() => {
     if (checked == null) onChange(nullDefault ?? true)
     else onChange(!checked)
    }}
    onKeyDown={(e) => {
     if (e.key === 'Backspace' || e.key === 'Clear') {
      e.stopPropagation()
      onChange(null)
     }
    }}
    className="col-start-1 row-start-1 cursor-pointer appearance-none outline-none checked:bg-amber-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
   />
   <svg
    fill="none"
    viewBox="0 0 14 14"
    className="pointer-events-none col-start-1 row-start-1 size-6 self-center justify-self-center stroke-stone-500 group-has-[:checked]:stroke-white group-has-[:disabled]:stroke-gray-950/25"
   >
    <path
     d="M3 8L6 11L11 3.5"
     strokeWidth={2}
     strokeLinecap="round"
     strokeLinejoin="round"
     className="opacity-0 group-has-[:checked]:opacity-100 group-has-[:indeterminate]:opacity-0"
    />
    <path
     d="M3 7H11"
     strokeWidth={2}
     strokeLinecap="round"
     strokeLinejoin="round"
     className="opacity-0 group-has-[:indeterminate]:opacity-50"
    />
    {/* X when unchecked */}
    <path
     d="M4 10L10 4M4 4L10 10"
     strokeWidth={2}
     strokeLinecap="round"
     strokeLinejoin="round"
     className="opacity-100 group-has-[:checked]:opacity-0 group-has-[:indeterminate]:opacity-0"
    />
   </svg>
  </div>
 )
}
