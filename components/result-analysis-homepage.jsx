'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileInput,
  GraduationCap,
  Layers,
  PenLine,
  School,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link'

export function ResultAnalysisHomepageComponent() {
  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div
        className="absolute inset-0 bg-grid-blue-200/50 bg-grid-small [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
      <div className="relative container mx-auto px-4 py-16 space-y-16">
        <div className="text-center space-y-4 mb-16">
          <h1
            className="text-5xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
            Result Analysis Dashboard
          </h1>
          <p className="text-xl text-blue-600/80 max-w-2xl mx-auto">
            Comprehensive analysis tools for educational performance tracking and data management
          </p>
        </div>

        {/* View Analysis Section */}
        <section
          className="space-y-6 bg-white rounded-xl shadow-xl p-8 border border-blue-100">
          <h2 className="text-3xl font-semibold text-blue-900 mb-8 text-center">View Result Analysis</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Class Analysis",
                description: "Track performance metrics across different classes and sections",
                icon: Users,
                link: "/class",
                gradient: "from-blue-600 to-blue-400"
              },
              {
                title: "Subject Analysis",
                description: "Analyze performance patterns in individual subjects",
                icon: BookOpen,
                link: "/subject",
                gradient: "from-blue-500 to-blue-300"
              },
              {
                title: "Student Analysis",
                description: "Individual student performance tracking and progress monitoring",
                icon: GraduationCap,
                link: "/student",
                gradient: "from-blue-700 to-blue-500"
              },
              {
                title: "Teacher Analysis",
                description: "Evaluate teaching effectiveness and student outcomes by instructor",
                icon: UserCheck,
                link: "/teacher",
                gradient: "from-blue-800 to-blue-600"
              }
            ].map((item, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden bg-white border border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                <div
                  className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center space-x-4 mb-4">
                    <div
                      className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-blue-900">{item.title}</h3>
                      <p className="text-blue-600/80 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Link href={item.link} className="inline-block w-full">
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 transition-all duration-300">
                        View Analysis
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Input Data Section */}
        <section
          className="space-y-6 bg-white rounded-xl shadow-xl p-8 border border-blue-100">
          <h2 className="text-3xl font-semibold text-blue-900 mb-8 text-center">Input Result Data</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Enter Course and Semester",
                description: "Add new courses and define semesters for academic structure",
                icon: Calendar,
                link: "/enterr",
                gradient: "from-blue-500 to-blue-300"
              },
              {
                title: "Session Entry Form and Subject Entry",
                description: "Create academic sessions and add subjects for comprehensive curriculum management",
                icon: Layers,
                link: "/sessions",
                gradient: "from-blue-600 to-blue-400"
              },
              {
                title: "Enter Class Details",
                description: "Input class information including subjects and faculty",
                icon: School,
                link: "/enter-class",
                gradient: "from-blue-700 to-blue-500"
              },
              {
                title: "Enter Student Marks",
                description: "Record individual student marks for various subjects",
                icon: PenLine,
                link: "/marks",
                gradient: "from-blue-800 to-blue-600"
              },
              {
                title: "Enter Teacher Details",
                description: "Add and update teacher profiles, subject assignments, and class responsibilities",
                icon: Users,
                link: "/teacher-subjects",
                gradient: "from-blue-900 to-blue-700"
              }
            ].map((item, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden bg-white border border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                <div
                  className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center space-x-4 mb-4">
                    <div
                      className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-blue-900">{item.title}</h3>
                      <p className="text-blue-600/80 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Link href={item.link} className="inline-block w-full">
                      <Button
                        className="w-full bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300">
                        Input Data
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>)
  );
}