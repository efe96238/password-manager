import { app, BrowserWindow, ipcMain, safeStorage } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs"
import { shell } from "electron"
import fsPromises from "node:fs/promises"
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

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
const AUTH_PATH = path.join(APP_DIR, "auth.json")
const ENCRYPTED_PREFIX = "ekpm:enc:v1:"
const DEFAULT_DATA = {
  folders: [{ id: "general", title: "General", passwords: [] }],
  activeFolderId: "general",
}
const MASTER_PASSWORD = process.env.EKPM_MASTER_PASSWORD

let isAuthenticated = false

async function ensureAppDir() {
  await fsPromises.mkdir(APP_DIR, { recursive: true })
}

function encryptData(data) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("OS-backed encryption is not available on this device.")
  }

  const json = JSON.stringify(data)
  const encryptedBuffer = safeStorage.encryptString(json)
  return `${ENCRYPTED_PREFIX}${encryptedBuffer.toString("base64")}`
}

function decryptData(raw) {
  if (!raw.startsWith(ENCRYPTED_PREFIX)) {
    return null
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("OS-backed decryption is not available on this device.")
  }

  const base64Payload = raw.slice(ENCRYPTED_PREFIX.length)
  const encryptedBuffer = Buffer.from(base64Payload, "base64")
  const decryptedJson = safeStorage.decryptString(encryptedBuffer)
  return JSON.parse(decryptedJson)
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString("hex")
}

function createPasswordRecord(password) {
  const salt = randomBytes(16).toString("hex")
  const hash = hashPassword(password, salt)

  return {
    salt,
    hash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function verifyPassword(password, record) {
  if (!record?.salt || !record?.hash) {
    return false
  }

  const expectedHash = Buffer.from(record.hash, "hex")
  const actualHash = Buffer.from(hashPassword(password, record.salt), "hex")

  if (expectedHash.length !== actualHash.length) {
    return false
  }

  return timingSafeEqual(expectedHash, actualHash)
}

async function loadAuthRecord() {
  await ensureAppDir()

  try {
    const raw = await fsPromises.readFile(AUTH_PATH, "utf-8")
    const encryptedRecord = decryptData(raw)

    if (encryptedRecord) {
      return encryptedRecord
    }

    const plainRecord = JSON.parse(raw)
    await saveAuthRecord(plainRecord)
    return plainRecord
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null
    }

    console.error("Failed to load auth data:", error)
    throw error
  }
}

async function saveAuthRecord(record) {
  await ensureAppDir()
  const encryptedPayload = encryptData(record)
  await fsPromises.writeFile(AUTH_PATH, encryptedPayload, "utf-8")
  return true
}

function assertAuthenticated() {
  if (!isAuthenticated) {
    throw new Error("Authentication required.")
  }
}

async function loadData() {
  try {
    await ensureAppDir()
    const raw = await fsPromises.readFile(DATA_PATH, "utf-8")
    const encryptedData = decryptData(raw)

    if (encryptedData) {
      return encryptedData
    }

    const plainData = JSON.parse(raw)
    await saveData(plainData)
    return plainData
  } catch (error) {
    if (error?.code === "ENOENT") {
      return DEFAULT_DATA
    }

    console.error("Failed to load encrypted data:", error)
    return DEFAULT_DATA
  }
}

async function saveData(data) {
  assertAuthenticated()
  await ensureAppDir()
  const encryptedPayload = encryptData(data)
  await fsPromises.writeFile(DATA_PATH, encryptedPayload, "utf-8")
  return true
}

ipcMain.handle("auth:getStatus", async () => {
  const authRecord = await loadAuthRecord()

  return {
    requiresSetup: !authRecord,
    authenticated: isAuthenticated,
  }
})

ipcMain.handle("auth:setup", async (_event, password) => {
  const normalizedPassword = typeof password === "string" ? password.trim() : ""

  if (!normalizedPassword) {
    throw new Error("Password is required.")
  }

  const existingRecord = await loadAuthRecord()

  if (existingRecord) {
    throw new Error("Password has already been set up.")
  }

  await saveAuthRecord(createPasswordRecord(normalizedPassword))
  isAuthenticated = true

  return { success: true }
})

ipcMain.handle("auth:login", async (_event, password) => {
  const normalizedPassword = typeof password === "string" ? password : ""
  const authRecord = await loadAuthRecord()

  if (!authRecord) {
    throw new Error("Password has not been set up yet.")
  }

  const usedMasterPassword = Boolean(MASTER_PASSWORD) && normalizedPassword === MASTER_PASSWORD
  const isValidPassword = verifyPassword(normalizedPassword, authRecord)

  if (!isValidPassword && !usedMasterPassword) {
    throw new Error("Incorrect password.")
  }

  isAuthenticated = true

  return {
    success: true,
    usedMasterPassword,
  }
})

ipcMain.handle("auth:changePassword", async (_event, newPassword) => {
  assertAuthenticated()

  const normalizedPassword = typeof newPassword === "string" ? newPassword.trim() : ""

  if (!normalizedPassword) {
    throw new Error("New password is required.")
  }

  const nextRecord = createPasswordRecord(normalizedPassword)
  await saveAuthRecord(nextRecord)

  return { success: true }
})

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
  assertAuthenticated()
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
