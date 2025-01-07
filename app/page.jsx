import { redirect } from 'next/navigation'

export default function Home() {
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-blue-600 dark:text-blue-400">
          Student Result Management System
        </h1>
        <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 md:text-xl mt-4">
          A comprehensive system for managing and analyzing student results. Access detailed analytics and insights about student performance.
        </p>
      </div>
    </div>
  )
}
