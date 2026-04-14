import React from "react"
import "./App.css"
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { DialogDescription } from "@radix-ui/react-dialog"

import Titlebar from "@/components/Titlebar"
import FolderPage from "@/components/folder-page"

const DEFAULT_FOLDERS = [
  { id: "general", title: "General", passwords: [] },
]

function AuthScreen({
  mode,
  password,
  setPassword,
  onSubmit,
  error,
  busy,
}) {
  const isSetup = mode === "setup"

  return (
    <div className="min-h-screen w-full bg-neutral-800 text-yellow-400">
      <Titlebar />
      <div className="flex min-h-[calc(100vh-1.75rem)] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900 p-8 shadow-lg shadow-black flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold">
            {isSetup ? "Create your app password" : "Unlock Password Manager"}
          </h1>
          <p className="mt-3 text-sm opacity-70">
            {isSetup
              ? "This password will protect access to the app."
              : "Enter your password to open the app."}
          </p>

          <input
            className="mt-6 w-full rounded-md bg-neutral-800 px-3 py-2 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSetup ? "Create password" : "Enter password"}
            type="password"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy) {
                onSubmit()
              }
            }}
          />

          {error && (
            <div className="mt-3 text-sm text-red-400">{error}</div>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="mt-6 w-full rounded-md bg-yellow-400 px-4 py-2 font-semibold text-black transition-all duration-200 hover:bg-black hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
          >
            {busy ? "Please wait..." : isSetup ? "Create Password" : "Login"}
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const MAX_NAME_LEN = 30

  const [folders, setFolders] = React.useState(DEFAULT_FOLDERS)
  const [activeFolderId, setActiveFolderId] = React.useState("general")
  const [hydrated, setHydrated] = React.useState(false)

  const [authMode, setAuthMode] = React.useState(null)
  const [isUnlocked, setIsUnlocked] = React.useState(false)
  const [authPassword, setAuthPassword] = React.useState("")
  const [authError, setAuthError] = React.useState("")
  const [authBusy, setAuthBusy] = React.useState(false)

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [newFolderTitle, setNewFolderTitle] = React.useState("")
  const [createError, setCreateError] = React.useState("")

  const activeFolder = folders.find((f) => f.id === activeFolderId)

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState(null)

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [passwordExist, setPasswordExist] = React.useState(false)
  const [newPasswordLabel, setNewPasswordLabel] = React.useState("")
  const [newPasswordMail, setNewPasswordMail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [createPasswordError, setCreatePasswordError] = React.useState("")

  const [isDeletePassOpen, setIsDeletePassOpen] = React.useState(false)
  const [deletePassTarget, setDeletePassTarget] = React.useState(null)

  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false)
  const [newAppPassword, setNewAppPassword] = React.useState("")
  const [changePasswordError, setChangePasswordError] = React.useState("")
  const [changePasswordBusy, setChangePasswordBusy] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      try {
        const status = await window.auth.getStatus()
        setAuthMode(status.requiresSetup ? "setup" : "login")
      } catch (error) {
        console.error("Auth status failed:", error)
        setAuthError("Could not initialize app security.")
        setAuthMode("login")
      }
    })()
  }, [])

  React.useEffect(() => {
    if (!isUnlocked) return

    ;(async () => {
      try {
        const data = await window.ekpm.load()

        if (!data) {
          setHydrated(true)
          return
        }

        if (Array.isArray(data.folders)) {
          setFolders(data.folders)
        }

        if (typeof data.activeFolderId === "string") {
          setActiveFolderId(data.activeFolderId)
        }

        setHydrated(true)
      } catch (error) {
        console.error("Load failed:", error)
        setHydrated(true)
      }
    })()
  }, [isUnlocked])

  React.useEffect(() => {
    if (!hydrated || !isUnlocked) return

    ;(async () => {
      try {
        await window.ekpm.save({ folders, activeFolderId })
      } catch (error) {
        console.error("Save failed:", error)
      }
    })()
  }, [folders, activeFolderId, hydrated, isUnlocked])

  async function handleAuthSubmit() {
    const normalizedPassword = authPassword.trim()

    if (!normalizedPassword) {
      setAuthError("Password is required.")
      return
    }

    setAuthBusy(true)
    setAuthError("")

    try {
      if (authMode === "setup") {
        await window.auth.setup(normalizedPassword)
      } else {
        await window.auth.login(normalizedPassword)
      }

      setAuthPassword("")
      setIsUnlocked(true)
      setHydrated(false)
    } catch (error) {
      setAuthError(error?.message || "Authentication failed.")
    } finally {
      setAuthBusy(false)
    }
  }

  function openCreateFolder() {
    setCreateError("")
    setNewFolderTitle("")
    setIsCreateOpen(true)
  }

  function cancelCreateFolder() {
    setIsCreateOpen(false)
    setCreateError("")
    setNewFolderTitle("")
  }

  function confirmCreateFolder() {
    const name = newFolderTitle.trim()
    if (!name) {
      setCreateError("Please enter a name for your folder.")
      return
    }
    if (name.length > MAX_NAME_LEN) {
      setCreateError(`Folder name must be ${MAX_NAME_LEN} characters or less.`)
      return
    }
    setFolders((prev) => [...prev, { id: crypto.randomUUID(), title: name, passwords: [] }])
    cancelCreateFolder()
  }

  function requestDeleteFolder(folder) {
    if (folder.id === "general") return
    setDeleteTarget(folder)
    setIsDeleteOpen(true)
  }

  function cancelDeleteFolder() {
    setIsDeleteOpen(false)
    setDeleteTarget(null)
  }

  function confirmDeleteFolder() {
    if (!deleteTarget) return

    setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id))

    if (activeFolderId === deleteTarget.id) {
      setActiveFolderId("general")
    }

    cancelDeleteFolder()
  }

  function openAddPassword() {
    setCreatePasswordError("")
    setNewPasswordLabel("")
    setNewPasswordMail("")
    setNewPassword("")
    setIsAddOpen(true)
  }

  function cancelAddPassword() {
    setIsAddOpen(false)
    setCreatePasswordError("")
    setNewPasswordLabel("")
    setNewPasswordMail("")
    setNewPassword("")
  }

  function confirmAddPassword() {
    const label = newPasswordLabel.trim()
    const email = newPasswordMail.trim()
    const pass = newPassword.trim()

    if (!label) {
      setCreatePasswordError("Label is required.")
      return
    }
    if (!pass) {
      setCreatePasswordError("Password is required, this is a password manager remember?")
      return
    }

    const entry = {
      id: crypto.randomUUID(),
      label,
      email: email || null,
      password: pass,
    }

    setFolders((prev) =>
      prev.map((f) =>
        f.id === activeFolderId
          ? { ...f, passwords: [...(f.passwords || []), entry] }
          : f
      )
    )

    setPasswordExist(true)
    cancelAddPassword()
  }

  function requestDeletePassword(passId) {
    setDeletePassTarget({ folderId: activeFolderId, passId })
    setIsDeletePassOpen(true)
  }

  function cancelDeletePassword() {
    setIsDeletePassOpen(false)
    setDeletePassTarget(null)
  }

  function confirmDeletePassword() {
    if (!deletePassTarget) return

    const { folderId, passId } = deletePassTarget

    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, passwords: (f.passwords || []).filter((p) => p.id !== passId) }
          : f
      )
    )

    cancelDeletePassword()
  }

  function openChangePassword() {
    setNewAppPassword("")
    setChangePasswordError("")
    setIsChangePasswordOpen(true)
  }

  function cancelChangePassword() {
    setNewAppPassword("")
    setChangePasswordError("")
    setChangePasswordBusy(false)
    setIsChangePasswordOpen(false)
  }

  async function confirmChangePassword() {
    const normalizedPassword = newAppPassword.trim()

    if (!normalizedPassword) {
      setChangePasswordError("New password is required.")
      return
    }

    setChangePasswordBusy(true)
    setChangePasswordError("")

    try {
      await window.auth.changePassword(normalizedPassword)
      cancelChangePassword()
    } catch (error) {
      setChangePasswordError(error?.message || "Could not change password.")
      setChangePasswordBusy(false)
    }
  }

  function MovingTrigger() {
    const { state } = useSidebar()

    return (
      <SidebarTrigger
        className={
          "fixed bottom-5 z-999 cursor-pointer bg-neutral-900 shadow-black shadow-lg transition-all duration-200 " +
          (state === "expanded"
            ? "left-[calc(var(--sidebar-width)+0.75rem)]"
            : "left-1")
        }
      />
    )
  }

  if (!authMode || !isUnlocked) {
    return (
      <AuthScreen
        mode={authMode ?? "login"}
        password={authPassword}
        setPassword={setAuthPassword}
        onSubmit={handleAuthSubmit}
        error={authError}
        busy={authBusy}
      />
    )
  }

  return (
    <div className="bg-neutral-800 min-w-full w-screen overflow-x-hidden">
      <div>
        <SidebarProvider>
          <Titlebar />
          <AppSidebar
            folders={folders}
            onCreateFolderClick={openCreateFolder}
            activeFolderId={activeFolderId}
            onSelectFolder={setActiveFolderId}
            onRequestDeleteFolder={requestDeleteFolder}
            onChangePasswordClick={openChangePassword}
          />
          <main className="pt-7">
            <MovingTrigger />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogContent className="bg-neutral-900 border-0">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400 font-bold">Create Folder</DialogTitle>
                  <DialogDescription className="text-yellow-400 opacity-60 text-sm">Create a new folder to group/organize your passwords.</DialogDescription>
                </DialogHeader>
                <input
                  className="mt-4 w-full bg-neutral-800 text-yellow-400 rounded-md px-3 py-2 outline-none"
                  value={newFolderTitle}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, MAX_NAME_LEN)
                    setNewFolderTitle(v)
                    if (createError) setCreateError("")
                  }}
                  maxLength={MAX_NAME_LEN}
                  placeholder="New folder name..."
                  autoFocus
                />
                {createError && (
                  <div className="mt-2 text-red-400 text-sm">{createError}</div>
                )}
                <DialogFooter className="mt-4 flex gap-2 justify-end">
                  <DialogClose asChild>
                    <button
                      className="px-4 py-2 rounded-md bg-neutral-800 text-yellow-400 cursor-pointer hover:bg-black transition-all duration-200"
                      onClick={cancelCreateFolder}
                      type="button"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200"
                    onClick={confirmCreateFolder}
                    type="button"
                  >
                    Create Folder
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <DialogContent className="bg-neutral-900 border-0">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400 font-bold">Delete Folder?</DialogTitle>
                  <DialogDescription className="text-yellow-400 opacity-60 text-sm">
                    {deleteTarget ? `Delete the folder ${deleteTarget.title}? All the passwords and data will be deleted. This cannot be undone.` : ""}
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                  <DialogClose asChild>
                    <button
                      className="px-4 py-2 rounded-md bg-neutral-800 text-yellow-400 cursor-pointer hover:bg-black transition-all duration-200"
                      onClick={cancelDeleteFolder}
                      type="button"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <DialogClose asChild>
                    <button
                      className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200"
                      onClick={confirmDeleteFolder}
                      type="button"
                    >
                      Delete Folder
                    </button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent className="bg-neutral-900 border-0">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400 font-bold">Add a new password</DialogTitle>
                  <DialogDescription className="text-yellow-400 opacity-60 text-sm">
                    Add a new password, its label and an email if it belongs to one.
                  </DialogDescription>
                </DialogHeader>

                <input
                  className="mt-4 w-full bg-neutral-800 text-yellow-400 rounded-md px-3 py-2 outline-none"
                  value={newPasswordLabel}
                  onChange={(e) => setNewPasswordLabel(e.target.value)}
                  placeholder="Label (required)"
                  autoFocus
                />

                <input
                  className="mt-3 w-full bg-neutral-800 text-yellow-400 rounded-md px-3 py-2 outline-none"
                  value={newPasswordMail}
                  onChange={(e) => setNewPasswordMail(e.target.value)}
                  placeholder="Email (optional)"
                />

                <input
                  className="mt-3 w-full bg-neutral-800 text-yellow-400 rounded-md px-3 py-2 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password (required)"
                />

                {createPasswordError && (
                  <div className="mt-2 text-red-400 text-sm">{createPasswordError}</div>
                )}

                <DialogFooter>
                  <DialogClose asChild>
                    <button
                      className="px-4 py-2 rounded-md bg-neutral-800 text-yellow-400 cursor-pointer hover:bg-black transition-all duration-200"
                      type="button"
                      onClick={cancelAddPassword}
                    >
                      Cancel
                    </button>
                  </DialogClose>

                  <button
                    className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200"
                    onClick={confirmAddPassword}
                    type="button"
                  >
                    Add
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeletePassOpen} onOpenChange={setIsDeletePassOpen}>
              <DialogContent className="bg-neutral-900 border-0">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400 font-bold">Delete this password?</DialogTitle>
                  <DialogDescription className="text-yellow-400 opacity-60 text-sm">
                    This password, its label and email will be deleted permanently.
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                  <DialogClose asChild>
                    <button
                      className="px-4 py-2 rounded-md bg-neutral-800 text-yellow-400 cursor-pointer hover:bg-black transition-all duration-200"
                      type="button"
                      onClick={cancelDeletePassword}
                    >
                      Cancel
                    </button>
                  </DialogClose>

                  <button
                    className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200"
                    onClick={confirmDeletePassword}
                    type="button"
                  >
                    Delete Password
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <DialogContent className="bg-neutral-900 border-0">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400 font-bold">Change app password</DialogTitle>
                  <DialogDescription className="text-yellow-400 opacity-60 text-sm">
                    Enter a new password for opening the app.
                  </DialogDescription>
                </DialogHeader>

                <input
                  className="mt-4 w-full bg-neutral-800 text-yellow-400 rounded-md px-3 py-2 outline-none"
                  value={newAppPassword}
                  onChange={(e) => setNewAppPassword(e.target.value)}
                  placeholder="New password"
                  type="password"
                  autoFocus
                />

                {changePasswordError && (
                  <div className="mt-2 text-red-400 text-sm">{changePasswordError}</div>
                )}

                <DialogFooter>
                  <DialogClose asChild>
                    <button
                      className="px-4 py-2 rounded-md bg-neutral-800 text-yellow-400 cursor-pointer hover:bg-black transition-all duration-200"
                      type="button"
                      onClick={cancelChangePassword}
                    >
                      Cancel
                    </button>
                  </DialogClose>

                  <button
                    className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={confirmChangePassword}
                    type="button"
                    disabled={changePasswordBusy}
                  >
                    {changePasswordBusy ? "Saving..." : "Change Password"}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="h-[calc(100vh-1.75rem)] w-full">
              {activeFolder && (
                <FolderPage
                  folder={activeFolder}
                  onAddPassword={openAddPassword}
                  onRequestDeletePassword={requestDeletePassword}
                />
              )}
            </div>
          </main>
        </SidebarProvider>
      </div>
    </div>
  )
}

export default App
