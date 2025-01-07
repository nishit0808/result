"use client"

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart,
  BookOpen,
  GraduationCap,
  Users,
  UserSquare2,
  FileInput,
  ScrollText,
  UserPlus,
  PenLine,
  UserCog,
  Calendar,
  Layers,
  School,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [showText, setShowText] = React.useState(true)

  // Handle text visibility with delay
  React.useEffect(() => {
    if (isExpanded) {
      // Small delay before showing text to allow width animation to start
      const timer = setTimeout(() => setShowText(true), 50)
      return () => clearTimeout(timer)
    } else {
      setShowText(false)
    }
  }, [isExpanded])

  const analysisMenuItems = [
    {
      title: "Class Analysis",
      href: "/class",
      icon: Users,
      description: "Track performance metrics across different classes and sessions"
    },
    {
      title: "Subject Analysis",
      href: "/subject",
      icon: BookOpen,
      description: "Analyze performance patterns in individual subjects"
    },
    {
      title: "Student Analysis",
      href: "/student",
      icon: GraduationCap,
      description: "Individual student performance tracking and progress monitoring"
    },
    {
      title: "Teacher Analysis",
      href: "/teacher",
      icon: UserSquare2,
      description: "Evaluate teaching effectiveness and student outcomes by instructor"
    }
  ]

  const inputMenuItems = [
    {
      title: "Enter Course and Semester",
      href: "/enterr",
      icon: Calendar,
      description: "Add new courses and define semesters for academic structure"
    },
    {
      title: "Session Entry Form",
      href: "/sessions",
      icon: Layers,
      description: "Create academic sessions and add subjects for comprehensive curriculum management"
    },
    {
      title: "Enter Class Details",
      href: "/enter-class",
      icon: School,
      description: "Input class information including subjects and faculty"
    },
    {
      title: "Enter Student Marks",
      href: "/marks",
      icon: PenLine,
      description: "Record individual student marks for various subjects"
    },
    {
      title: "Enter Teacher Details",
      href: "/teacher-subjects",
      icon: UserCog,
      description: "Add and update teacher profiles, subject assignments, and class responsibilities"
    }
  ]

  return (
    <div className={`pb-12 min-h-screen relative transition-all duration-300 ${isExpanded ? 'w-72' : 'w-20'}`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-4 h-8 w-8 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <Link
            href="/home"
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900 mb-4
              ${pathname === '/home' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}
              ${!isExpanded && 'justify-center'}
            `}
            title={!isExpanded ? "Home" : undefined}
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            {isExpanded && (
              <div className={`flex-1 transition-opacity duration-300 ${showText ? 'opacity-100' : 'opacity-0'}`}>
                <div className="font-medium">Home</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  Return to homepage
                </p>
              </div>
            )}
          </Link>
          {isExpanded && (
            <h2 className={`mb-2 px-4 text-lg font-semibold transition-opacity duration-300 ${showText ? 'opacity-100' : 'opacity-0'}`}>
              View Result Analysis
            </h2>
          )}
          <div className="space-y-1">
            {analysisMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900
                    ${pathname === item.href ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}
                    ${!isExpanded && 'justify-center'}
                  `}
                  title={!isExpanded ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {isExpanded && (
                    <div className={`flex-1 transition-opacity duration-300 ${showText ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="font-medium">{item.title}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
        <div className="px-3 py-2">
          {isExpanded && (
            <h2 className={`mb-2 px-4 text-lg font-semibold transition-opacity duration-300 ${showText ? 'opacity-100' : 'opacity-0'}`}>
              Input Result Data
            </h2>
          )}
          <div className="space-y-1">
            {inputMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900
                    ${pathname === item.href ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}
                    ${!isExpanded && 'justify-center'}
                  `}
                  title={!isExpanded ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {isExpanded && (
                    <div className={`flex-1 transition-opacity duration-300 ${showText ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="font-medium">{item.title}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
