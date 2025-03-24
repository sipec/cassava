import { open } from '@tauri-apps/plugin-dialog'
import {
 BaseDirectory,
 readTextFile,
 rename,
 writeTextFile,
} from '@tauri-apps/plugin-fs'

export async function openFile() {
 return await open({
  filters: [{ name: 'CSV', extensions: ['csv', 'tsv'] }],
 })
}

export async function readFile(path: string) {
 return await readTextFile(path)
}

export async function saveFile(path: string, contents: string) {
 await writeTextFile(path, contents)
}

export async function mv(from: string, to: string) {
 await rename(from, to, {
  oldPathBaseDir: BaseDirectory.Desktop,
  newPathBaseDir: BaseDirectory.Desktop,
 })
}
