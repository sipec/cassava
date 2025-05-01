import { HyperFormula } from 'hyperformula'

const instance = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })

const ids: { [path: string]: number } = {}

const getId = (path: string) =>
 (ids[path] ??= instance.getSheetId(instance.addSheet(path)) as number)

export const loadForumula = (path: string, data: string[][]) =>
 instance.setSheetContent(getId(path), data)

export const getDisplayData = (path: string) =>
 instance
  .getSheetValues(getId(path))
  .map((y) => y.map((x) => x?.toString() ?? ''))
