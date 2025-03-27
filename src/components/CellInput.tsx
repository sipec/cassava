import {
 type ColumnType,
 parseColumnType,
 parseSelectOptions,
} from '../lib/parser/types'
import { Checkbox } from './inputs/Checkbox'
import { DateInput } from './inputs/DateInput'
import { SelectInput } from './inputs/SelectInput'
import { TextInput } from './inputs/TextInput'

export const CellInput = (props: {
 value: string
 setValue: (value: string) => void
 nullDefault?: string
 type: ColumnType
}) => {
 const { value, setValue, nullDefault, type } = props

 const columnType = parseColumnType(type)
 const options = parseSelectOptions(type)

 switch (columnType) {
  case 'number':
   return <TextInput {...props} type="number" />
  case 'date':
   return <DateInput {...props} />
  case 'logical':
   return (
    <Checkbox
     checked={value === 'true' ? true : value === 'false' ? false : null}
     nullDefault={
      nullDefault === 'true'
       ? true
       : nullDefault === 'false'
         ? false
         : undefined
     }
     onChange={(checked) =>
      setValue(checked === null ? '' : checked ? 'true' : 'false')
     }
    />
   )
  case 'select':
   return <SelectInput {...props} options={options} />
  // case 'multiselect':
  // return <MultiSelectInput {...props} options={options} />
  default:
   return <TextInput {...props} type="text" />
 }
}
