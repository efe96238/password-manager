import React from "react"
import './App.css'
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { DialogDescription } from "@radix-ui/react-dialog"

import Titlebar from "@/components/Titlebar"
import FolderPage from "@/components/folder-page"

function App({children}) {

  //create folder logic
  const MAX_NAME_LEN = 30

  const [folders, setFolders] = React.useState([
  { id: "general", title: "General", passwords: [] },
  ])

  const [activeFolderId, setActiveFolderId] = React.useState("general")

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [newFolderTitle, setNewFolderTitle] = React.useState("")
  const [createError, setCreateError] = React.useState("")

  const activeFolder = folders.find(f => f.id === activeFolderId)

  const [hydrated, setHydrated] = React.useState(false)

  // load on start
  React.useEffect(() => {
    ;(async () => {
      try {
        const data = await window.ekpm.load()

        if (!data) {
          setHydrated(true)
          return
        }

        if (Array.isArray(data.folders)) setFolders(data.folders)

        if (typeof data.activeFolderId === "string") {
          setActiveFolderId(data.activeFolderId)
        }

        setHydrated(true)
      } catch (e) {
        console.error("Load failed:", e)
        setHydrated(true)
      }
    })()
  }, [])

  // auto save (ONLY after load finished)
  React.useEffect(() => {
    if (!hydrated) return
    ;(async () => {
      try {
        await window.ekpm.save({ folders, activeFolderId })
      } catch (e) {
        console.error("Save failed:", e)
      }
    })()
  }, [folders, activeFolderId, hydrated])

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

  //delete folder logic
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState(null)

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

  // Add password logic
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [passwordExist, setPasswordExist] = React.useState(false)

  const [newPasswordLabel, setNewPasswordLabel] = React.useState("")
  const [newPasswordMail, setNewPasswordMail] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")

  const [createPasswordError, setCreatePasswordError] = React.useState("")

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
          ? {...f, passwords: [...(f.passwords || []), entry]}
          : f
    ))

    setPasswordExist(true)
    cancelAddPassword()
  }

  const [isDeletePassOpen, setIsDeletePassOpen] = React.useState(false)
  const [deletePassTarget, setDeletePassTarget] = React.useState(null)

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

  //so the trigger moves with the sidebar again
  function MovingTrigger(){
    const {state} = useSidebar()

    return(
      <SidebarTrigger className={"fixed bottom-5 z-999 cursor-pointer bg-neutral-900 shadow-black shadow-lg transition-all duration-200 " + 
        (state === "expanded"
          ? "left-[calc(var(--sidebar-width)+0.75rem)]"
          : "left-1"
        )
      }/>
    )
  }

  return (
    <div className='bg-neutral-800 min-w-full w-screen overflow-x-hidden'>
      <div>
        <SidebarProvider>
          <Titlebar/>
          <AppSidebar folders={folders} onCreateFolderClick={openCreateFolder} activeFolderId={activeFolderId} onSelectFolder={setActiveFolderId} onRequestDeleteFolder={requestDeleteFolder}/>
          <main className="pt-7">
            <MovingTrigger/>

            {/*Create Folder Dialog*/}

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
                  autoFocus/>
                {createError && (
                  <div className="mt-2 text-red-400 text-sm">{createError}</div>
                )}
                <DialogFooter className="mt-4 flex gap-2 justify-end">
                  <DialogClose asChild>
                    <button
                      className="px-4 py-2 rounded-md bg-neutral-800 text-yellow-400 cursor-pointer hover:bg-black transition-all duration-200"
                      onClick={cancelCreateFolder}
                      type="button">
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200"
                    onClick={confirmCreateFolder}
                    type="button">
                    Create Folder
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/*Delete Folder Dialog*/}

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
                      type="button">
                      Cancel
                    </button>
                  </DialogClose>
                  <DialogClose asChild>
                    <button className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200"
                    onClick={confirmDeleteFolder}
                    type="button">
                      Delete Folder
                    </button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/*add pass dialog*/}

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
                    <button className="px-4 py-2 rounded-md bg-neutral-800 text-yellow-400 cursor-pointer hover:bg-black transition-all duration-200"
                    type="button"
                    onClick={cancelAddPassword}>
                      Cancel
                    </button>
                  </DialogClose>

                  <button
                    className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200"
                    onClick={confirmAddPassword}
                    type="button">
                    Add
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/*delete pass dialog*/}

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
                    <button className="px-4 py-2 rounded-md bg-neutral-800 text-yellow-400 cursor-pointer hover:bg-black transition-all duration-200"
                    type="button"
                    onClick={cancelDeletePassword}>
                      Cancel
                    </button>
                  </DialogClose>

                  <button
                    className="px-4 py-2 rounded-md bg-yellow-400 text-black cursor-pointer hover:bg-black hover:text-yellow-400 transition-all duration-200"
                    onClick={confirmDeletePassword}
                    type="button">
                    Delete Password
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="h-[calc(100vh-1.75rem)] w-full">
              {activeFolder && (
                <FolderPage folder={activeFolder} onAddPassword={openAddPassword} onRequestDeletePassword={requestDeletePassword}/>
              )}
            </div>
          </main>
        </SidebarProvider>
      </div>
    </div>
  )
}

export default App
