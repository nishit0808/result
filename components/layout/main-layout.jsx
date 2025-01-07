import { Sidebar } from "@/components/ui/sidebar"

export function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="hidden lg:block bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-r">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
