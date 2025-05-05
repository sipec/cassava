import { event } from '@tauri-apps/api'
import {
 Menu,
 MenuItem,
 PredefinedMenuItem,
 Submenu,
} from '@tauri-apps/api/menu'

const menu = await Menu.new({
 items: [
  await Submenu.new({
   text: 'cassava',
   items: [
    await MenuItem.new({
     id: 'about',
     text: 'About',
     accelerator: 'CmdOrCtrl+A',
    }),
   ],
  }),

  await Submenu.new({
   text: 'File',
   items: [
    await MenuItem.new({
     id: 'new-window',
     text: 'New Window',
     accelerator: 'CmdOrCtrl+N',
    }),
    await MenuItem.new({
     id: 'new-tab',
     text: 'New Tab',
     accelerator: 'CmdOrCtrl+T',
    }),
    await MenuItem.new({
     id: 'close-tab',
     text: 'Close Tab',
     accelerator: 'CmdOrCtrl+W',
    }),
    await MenuItem.new({
     id: 'close-window',
     text: 'Close Window',
     accelerator: 'CmdOrCtrl+Shift+W',
    }),
   ],
  }),

  await Submenu.new({
   text: 'Edit',
   items: [
    await PredefinedMenuItem.new({
     item: 'Undo',
     text: 'Undo',
    }),
    await PredefinedMenuItem.new({
     item: 'Redo',
     text: 'Redo',
    }),

    await PredefinedMenuItem.new({ text: 'separator-text', item: 'Separator' }),

    await MenuItem.new({
     id: 'cut',
     text: 'Cut',
     accelerator: 'CmdOrCtrl+X',
     action: () => event.emit('cut'),
    }),
    await MenuItem.new({
     id: 'copy',
     text: 'Copy',
     accelerator: 'CmdOrCtrl+C',
     action: () => event.emit('copy'),
    }),
    await MenuItem.new({
     id: 'paste',
     text: 'Paste',
     accelerator: 'CmdOrCtrl+V',
     action: () => event.emit('paste'),
    }),
   ],
  }),

  // await Submenu.new({
  //  text: 'View',
  //  items: [
  //   await MenuItem.new({
  //    id: 'toggle-dev-tools',
  //    text: 'Toggle Developer Tools',
  //    accelerator: 'CmdOrCtrl+Shift+I',
  //   }),
  //  ],
  // }),

  await Submenu.new({
   text: 'Window',
   items: [
    await PredefinedMenuItem.new({
     item: 'Minimize',
     text: 'Minimize',
    }),
    await PredefinedMenuItem.new({
     item: 'Fullscreen',
     text: 'Fullscreen',
    }),
   ],
  }),

  await Submenu.new({
   text: 'Help',
   items: [],
  }),
 ],
})

// If a window was not created with an explicit menu or had one set explicitly,
// this menu will be assigned to it.
menu.setAsAppMenu()
