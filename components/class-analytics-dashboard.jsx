'use client'

import * as React from 'react'
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip, XAxis, YAxis } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Trophy,
  TrendingUp,
  PieChart as PieChartIcon,
} from "lucide-react";
import axios from 'axios'


const studentDistribution = [
  { name: 'Pass', value: 18, color: '#4299E1' },
  { name: 'Supplementary', value: 4, color: '#63B3ED' },
  { name: 'Fail', value: 2, color: '#90CDF4' },
]

const subjectPerformanceData = [
  { subject: "Mathematics", average: 82, color: '#2B6CB0' },
  { subject: "Science", average: 75, color: '#3182CE' },
  { subject: "English", average: 88, color: '#4299E1' },
  { subject: "History", average: 79, color: '#63B3ED' },
]

const topStudents = [
  { id: 1, name: "Alex Thompson", average: 95, trend: "up", change: "+5.2%" },
  { id: 2, name: "Sarah Wilson", average: 92, trend: "up", change: "+3.8%" },
  { id: 3, name: "Michael Chen", average: 90, trend: "down", change: "-1.2%" },
]

const strugglingStudents = [
  { id: 1, name: "James Wilson", average: 65, subject: "Mathematics" },
  { id: 2, name: "Lisa Anderson", average: 68, subject: "Science" },
  { id: 3, name: "David Martinez", average: 67, subject: "History" },
]

const studentResults = [
  { name: "Alex Thompson", totalMarks: 560, division: "Pass" },
  { name: "Sarah Wilson", totalMarks: 542, division: "Pass" },
  { name: "Michael Chen", totalMarks: 515, division: "Pass" },
  { name: "James Wilson", totalMarks: 320, division: "Fail" },
  { name: "Lisa Anderson", totalMarks: 380, division: "Supply" },
  { name: "David Martinez", totalMarks: 410, division: "Supply" },
  { name: "Emily Brown", totalMarks: 490, division: "Pass" },
  { name: "Daniel Lee", totalMarks: 505, division: "Pass" },
  { name: "Sophia Garcia", totalMarks: 475, division: "Pass" },
  { name: "Ethan Wright", totalMarks: 350, division: "Fail" },
]

export function ClassAnalyticsDashboardComponent() {
  const [courses, setCourses] = React.useState([])
  const [selectedClass, setSelectedClass] = React.useState("")
  const [selectedSemester, setSelectedSemester] = React.useState("")
  const [selectedCourseIndex, setSelectedCourseIndex] = React.useState("")

  React.useEffect(() => {
    axios
      .get(`/api/course`)
      .then((res) =>
        setCourses(res.data)
      )
      .catch((err) => console.log(err))
  }, [])

  React.useEffect(() => {
    const selectedCourse = courses.findIndex((course) => course.name === selectedClass)
    setSelectedCourseIndex(selectedCourse)
  }, [selectedClass])

  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="container mx-auto p-4 space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1
              className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Class Analytics Dashboard</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course, index) => (
                    <SelectItem key={index} value={course.name}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCourseIndex !== "" && courses[selectedCourseIndex]?.semester?.map((semester, index) => (
                    <SelectItem key={index} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedClass && selectedSemester ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Class Average</CardTitle>
                  <BookOpen className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">82.5%</div>
                  <p className="text-sm text-blue-200">+2.5% from last semester</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Top Score</CardTitle>
                  <Trophy className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">95%</div>
                  <p className="text-sm text-blue-200">Alex Thompson - Mathematics</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Need Support</CardTitle>
                  <AlertTriangle className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">3</div>
                  <p className="text-sm text-blue-200">Students below 70%</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Student Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value">
                          {studentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                    Subject Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjectPerformanceData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" />
                        <YAxis dataKey="subject" type="category" />
                        <Tooltip />
                        <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                          {subjectPerformanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Student Results</CardTitle>
                <CardDescription>Overview of student performance and divisions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Division</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentResults.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.totalMarks}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.division === "Pass"
                                ? "success"
                                : student.division === "Fail"
                                  ? "destructive"
                                  : "warning"
                            }>
                            {student.division}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topStudents.map((student) => (
                      <div key={student.id} className="flex items-center">
                        <Avatar className="h-10 w-10 border-2 border-blue-300">
                          <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={student.name} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{student.name}</p>
                          <p className="text-sm text-blue-200">
                            Average: {student.average}%
                          </p>
                        </div>
                        <div
                          className={`ml-auto font-medium ${student.trend === 'up' ? 'text-green-300' : 'text-red-300'
                            }`}>
                          {student.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {student.change}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Needs Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {strugglingStudents.map((student) => (
                      <div key={student.id} className="flex items-center">
                        <Avatar className="h-10 w-10 border-2 border-blue-300">
                          <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={student.name} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{student.name}</p>
                          <p className="text-sm text-blue-200">
                            Average: {student.average}%
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-auto bg-blue-700 text-blue-100">
                          {student.subject}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <BookOpen className="h-16 w-16 text-blue-500 mb-6" />
              <h2 className="text-2xl font-semibold mb-2">Select Class and Semester</h2>
              <p className="text-muted-foreground text-center max-w-sm">
                Choose a class and semester from the dropdowns above to view the analytics dashboard.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>)
  );
}