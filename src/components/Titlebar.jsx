import React from 'react'
import { X, Maximize, Minus } from 'lucide-react'

const Titlebar = () => {

  function handleClose(){
    window.close()
  }

  function handleToggleMaximize() {
    window.api.toggleMaximize()
  }

  function handleMinimize() {
    window.api.minimize()
  }

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-neutral-950" style={{ WebkitAppRegion: "drag" }}>
      <div className="relative h-7 flex items-center justify-evenly">
        <div onClick={handleClose} className="absolute flex items-center justify-center right-0 h-full w-10 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-200 " style={{ WebkitAppRegion: "no-drag" }}>
          <X className='size-5'/>
        </div>
        <div onClick={handleToggleMaximize} className='absolute flex items-center justify-center right-10 h-full w-10! text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-200' style={{ WebkitAppRegion: "no-drag" }}>
          <Maximize className='size-5'/>
        </div>
        <div onClick={handleMinimize} className='absolute flex items-center justify-center right-20 h-full w-10 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-200' style={{ WebkitAppRegion: "no-drag" }}>
          <Minus className='size-5'/>
        </div>
      </div>
    </div>
  )
}

export default Titlebar
