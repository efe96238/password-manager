import React from "react"
import { Button } from "@/components/ui/button"
import { CirclePlus, Trash2, Eye, SquarePlus } from "lucide-react"

const FolderPage = ({ folder, onAddPassword, onRequestDeletePassword }) => {
  const hasPasswords = (folder.passwords?.length ?? 0) > 0

  const [isShown, setIsShown] = React.useState({})

  return (
    <>
      <div className="flex justify-center pt-5 inset-x-0 relative w-screen">
        <h1 className="text-yellow-400 text-6xl font-bold bg-neutral-900 h-25 flex items-center justify-center rounded-2xl shadow-black shadow-lg px-8">
          {folder.title}
        </h1>
      </div>

      {!hasPasswords ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-neutral-900 flex flex-col items-center gap-5 rounded-xl h-45 w-100 justify-center shadow-lg shadow-black">
            <p className="text-yellow-400 text-xl">Add your first password to start.</p>
            <Button
              variant="outline"
              onClick={onAddPassword}
              className="bg-yellow-400 border-none hover:bg-black hover:text-yellow-400 cursor-pointer text-lg"
            >
              Add Password
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-20 w-screen flex justify-center">
          <div className="grid gap-15 items-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folder.passwords.map((p) => (
              <div key={p.id} className="bg-neutral-900 rounded-xl shadow-lg shadow-black p-4 w-80">
                <div className="text-yellow-400 font-bold truncate">{p.label}</div>
                {p.email && <div className="text-yellow-400 opacity-70 truncate">{p.email}</div>}
                {isShown[p.id] ? (<div className="text-yellow-400 opacity-70 truncate">{p.password}</div>) :
                <div className="text-yellow-400">••••••••</div>}
                <div className="flex gap-3 text-yellow-400 pt-2">
                  <Eye type="button" onClick={() => setIsShown((prev) => ({...prev, [p.id]: !prev[p.id]}))} className="hover:bg-yellow-400 hover:text-black rounded-sm shrink-0 p-1 cursor-pointer transition-all duration-200" />
                  <Trash2 type="button" onClick={() => onRequestDeletePassword(p.id)} className="hover:bg-yellow-400 hover:text-black rounded-sm shrink-0 p-1 cursor-pointer transition-all duration-200" />
                </div>
              </div>
            ))}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onAddPassword}
                className="w-80 h-34 bg-neutral-900 cursor-pointer rounded-xl shadow-lg shadow-black flex items-center justify-center hover:bg-black transition-all duration-200"
              >
                <SquarePlus className="text-yellow-400 size-8" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FolderPage
