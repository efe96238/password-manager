import { FolderPlus, FolderClosed, FolderOpen, Trash2 } from "lucide-react"
import ShinyText from './ShinyText'
import TiltedCard from './TiltedCard'
import eklogo from "@/assets/eklogo.png"
 
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ folders, onCreateFolderClick, activeFolderId, onSelectFolder, onRequestDeleteFolder }) {
  return (
    <Sidebar>
      <SidebarContent className='bg-neutral-900 h-full flex flex-col pt-7 shadow-lg shadow-black'>
        <SidebarGroup className='flex flex-col gap-4'>
          <div className="flex gap-2 justify-evenly">
            <a href="https://efekurnaz.com" target="_blank" rel="noreferrer">
              <TiltedCard
                imageSrc={eklogo}
                altText="Efe Kurnaz Website"
                containerHeight="3rem"
                containerWidth="3rem"
                imageHeight="3rem"
                imageWidth="3rem"
                rotateAmplitude={12}
                scaleOnHover={1.1}
                showMobileWarning={false}
                showTooltip={false}
              />
            </a>
            <ShinyText
              text="Password Manager"
              speed={3}
              delay={3}
              color="#facc15"
              shineColor="#fcea9f"
              spread={120}
              direction="left"
              yoyo={false}
              pauseOnHover={false}
              className="pt-3 text-xl cursor-default"
            />
          </div>
          <div className="h-1 w-58 bg-black rounded-xl"></div>
          <SidebarGroupContent className='text-yellow-400'>
            <SidebarMenu>
              <SidebarMenuItem key="create">
                <SidebarMenuButton
                  onClick={onCreateFolderClick}
                  className='hover:bg-black hover:text-yellow-400 active:bg-black active:text-yellow-400 transition-all duration-300 h-10 w-60 cursor-pointer'>
                  <FolderPlus />
                  <span className="text-xl">Create New Folder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {folders.map((f) => {
                const isActive = f.id === activeFolderId
                const Icon = isActive ? FolderOpen : FolderClosed

                return(
                  <SidebarMenuItem key={f.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectFolder(f.id)}
                      isActive={isActive}
                      className='hover:bg-black hover:text-yellow-400 active:bg-black active:text-yellow-400 transition-all duration-300 h-10 w-60 data-[active=true]:bg-black data-[active=true]:text-yellow-400 data-[active=true]:font-normal cursor-pointer'>
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="shrink-0"/>
                          <span className="text-xl truncate">{f.title}</span>
                        </div>
                        {f.id !== "general" && (
                        <div className="p-1 rounded-md hover:bg-yellow-400 hover:text-black transition-colors shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRequestDeleteFolder(f)
                          }}>
                          <Trash2 className="size-5"/>
                        </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto">
          <SidebarGroupLabel className='text-yellow-400 justify-start opacity-50 cursor-default'>v1.0</SidebarGroupLabel>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}