export const DateInput = (props: {
 value: string | null
 setValue: (value: string) => void
 nullDefault?: string
}) => {
 const { value, setValue, nullDefault } = props
 return (
  <input
   type="date"
   value={value || ''}
   onChange={(e) => setValue(e.target.value)}
   onClick={() => {
    if (!value && nullDefault) setValue(nullDefault)
   }}
   className="h-full w-full bg-transparent p-2 outline-none"
  />
 )
}

// TODO: typed date parsing, relative human dates. nice datepicker.
