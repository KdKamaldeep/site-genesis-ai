import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Calendar,
  KeyRound,
  LogOut,
  Sparkles,
  LucideIcon
} from 'lucide-react'
import { authAPI } from '@/api-client'

interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const menuItems: MenuItem[] = [
  { href: '/tenants', label: 'Tenants', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { href: '/keywords', label: 'Keywords', icon: KeyRound, color: 'from-purple-500 to-pink-500' },
  { href: '/content', label: 'Content', icon: FileText, color: 'from-green-500 to-emerald-500' },
  { href: '/templates', label: 'Templates', icon: LayoutDashboard, color: 'from-orange-500 to-red-500' },
  { href: '/scheduler', label: 'Scheduler', icon: Calendar, color: 'from-indigo-500 to-blue-500' },
  { href: '/settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-slate-500' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async (): Promise<void> => {
    try {
      await authAPI.logout()
      localStorage.removeItem('token')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <aside className="w-64 md:w-72 glass-effect min-h-screen p-5 md:p-6 flex flex-col border-r border-white/20">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gradient">SiteGenesis AI</h1>
            <p className="text-xs text-muted-foreground font-medium">Content Platform</p>
          </div>
        </div>
      </div>
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href || location.pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                  : "hover:bg-white/70 text-foreground hover:shadow-sm"
              )}
            >
              <div className={cn(
                "p-1.5 md:p-2 rounded-lg transition-all flex-shrink-0",
                isActive 
                  ? "bg-white/20" 
                  : `bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100`
              )}>
                <Icon className={cn(
                  "w-4 h-4 md:w-5 md:h-5 transition-all",
                  isActive ? "text-white" : "text-gray-600 group-hover:text-white"
                )} />
              </div>
              <span className={cn(
                "font-medium text-sm md:text-base transition-all",
                isActive ? "text-white" : "group-hover:text-gray-900"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200 hover:shadow-sm mt-auto"
      >
        <div className="p-1.5 md:p-2 rounded-lg bg-red-100 flex-shrink-0">
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <span className="font-medium text-sm md:text-base">Logout</span>
      </button>
    </aside>
  )
}

