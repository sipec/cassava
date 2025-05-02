import { HyperFormula } from 'hyperformula'

const instance = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })

const ids: { [path: string]: number } = {}

const getId = (path: string) =>
 (ids[path] ??= instance.getSheetId(instance.addSheet(path)) as number)

export const setFormulaSheet = (path: string, data: string[][]) => {
 const id = getId(path)
 instance.setSheetContent(id, data)
 return instance
  .getSheetValues(id)
  .map((y) => y.map((x) => x?.toString() ?? ''))
}
