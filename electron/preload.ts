import { ipcRenderer, contextBridge } from 'electron'

console.log("PRELOAD LOADED OK")

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld("api", {
  toggleMaximize: () => ipcRenderer.invoke("window:toggleMaximize"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
})

contextBridge.exposeInMainWorld("ekpm", {
  load: () => ipcRenderer.invoke("ekpm:load"),
  save: (data: unknown) => ipcRenderer.invoke("ekpm:save", data),
})
