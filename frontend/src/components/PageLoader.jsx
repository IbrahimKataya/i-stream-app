import { Tv } from "lucide-react"
import { useThemeStore } from "../store/useThemeStore"

const PageLoader = () => {
  const {theme} = useThemeStore();
  return (
    <div className="min-h-screen flex items-center justify-center" data-theme={theme}>
        <Tv className="animate-bounce size-14 text-primary"/>
    </div>
  )
}

export default PageLoader