import { Tv } from "lucide-react"
import { useThemeStore } from "../store/useThemeStore"

function ChatLoader(){
  const {theme} = useThemeStore();
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4" data-theme={theme}>
        <Tv className="animate-bounce size-14 text-primary"/>
        <p className="mt-4 text-center text-lg font-mono">
            Connecting to chat...
        </p>
    </div>
  )
}

export default ChatLoader;