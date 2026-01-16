import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs"
import { shell } from "electron"
import fsPromises from "node:fs/promises"

createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;

let win;

//saving to a json
const APP_DIR = path.join(app.getPath("appData"), "EKPasswordManager")
const DATA_PATH = path.join(APP_DIR, "data.json")

async function ensureAppDir() {
  await fsPromises.mkdir(APP_DIR, { recursive: true })
}

async function loadData() {
  console.log("LOADING FROM:", DATA_PATH)
  try {
    await ensureAppDir()
    const raw = await fsPromises.readFile(DATA_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {
      folders: [{ id: "general", title: "General", passwords: [] }],
      activeFolderId: "general",
    }
  }
}

async function saveData(data) {
  await ensureAppDir()
  await fsPromises.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8")
  console.log("SAVING TO:", DATA_PATH)
  return true
}

ipcMain.handle("window:toggleMaximize", (event) => {
  const w = BrowserWindow.fromWebContents(event.sender)
  if (!w) return
  w.isMaximized() ? w.unmaximize() : w.maximize()
})

ipcMain.handle("window:minimize", (event) => {
  const w = BrowserWindow.fromWebContents(event.sender)
  w?.minimize()
})

ipcMain.handle("ekpm:load", async () => {
  return await loadData()
})

ipcMain.handle("ekpm:save", async (_event, data) => {
  return await saveData(data)
})

const preloadPath = path.join(__dirname$1, "preload.mjs")
console.log("PRELOAD PATH =", preloadPath)
console.log("PRELOAD EXISTS =", fs.existsSync(preloadPath))

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    minHeight: 500,
    minWidth: 800,
    frame: false,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    icon: path.join(process.env.VITE_PUBLIC, "logo.png"),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  win.webContents.on("will-navigate", (event, url) => {
    // open external links in browser, keep your app routes inside the app
    if (url !== win.webContents.getURL()) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
