'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const sessionOptions = [
  { value: "2023-24", label: "2023-24" },
  { value: "2022-23", label: "2022-23" },
  { value: "2021-22", label: "2021-22" },
]

const courseOptions = [
  { value: "btech-cse", label: "B.Tech CSE" },
  { value: "btech-it", label: "B.Tech IT" },
  { value: "btech-ece", label: "B.Tech ECE" },
]

const semesterOptions = [
  { value: "1", label: "1st Semester" },
  { value: "2", label: "2nd Semester" },
  { value: "3", label: "3rd Semester" },
  { value: "4", label: "4th Semester" },
]

const subjectOptions = [
  { value: "math", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "programming", label: "Programming" },
]

const studentData = [
  { id: 1, name: "John Doe", internal: 18, external: 67, total: 85 },
  { id: 2, name: "Jane Smith", internal: 17, external: 65, total: 82 },
  { id: 3, name: "Alex Johnson", internal: 19, external: 69, total: 88 },
  { id: 4, name: "Sarah Williams", internal: 16, external: 62, total: 78 },
  { id: 5, name: "Mike Brown", internal: 15, external: 58, total: 73 },
  { id: 6, name: "Emily Davis", internal: 18, external: 66, total: 84 },
  { id: 7, name: "Chris Wilson", internal: 14, external: 55, total: 69 },
  { id: 8, name: "Anna Lee", internal: 19, external: 70, total: 89 },
]

export function SubjectAnalysisComponent() {
  const [selectedSession, setSelectedSession] = React.useState("")
  const [selectedCourse, setSelectedCourse] = React.useState("")
  const [selectedSemester, setSelectedSemester] = React.useState("")
  const [selectedSubject, setSelectedSubject] = React.useState("")

  const classAverage = React.useMemo(() => {
    return studentData.reduce((sum, student) => sum + student.total, 0) / studentData.length;
  }, [])

  const topPerformers = React.useMemo(() => {
    return [...studentData].sort((a, b) => b.total - a.total).slice(0, 3);
  }, [])

  const passFailCounts = React.useMemo(() => {
    const passCount = studentData.filter(student => student.total >= 40).length
    return { pass: passCount, fail: studentData.length - passCount }
  }, [])

  const passPercentage = React.useMemo(() => {
    return (passFailCounts.pass / studentData.length) * 100
  }, [passFailCounts])

  const marksDistribution = React.useMemo(() => {
    const distribution = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ]
    studentData.forEach(student => {
      if (student.total <= 20) distribution[0].count++
      else if (student.total <= 40) distribution[1].count++
      else if (student.total <= 60) distribution[2].count++
      else if (student.total <= 80) distribution[3].count++
      else distribution[4].count++
    })
    return distribution
  }, [])

  const gradeDistribution = React.useMemo(() => {
    const distribution = [
      { grade: 'A', count: 0 },
      { grade: 'B', count: 0 },
      { grade: 'C', count: 0 },
      { grade: 'D', count: 0 },
      { grade: 'F', count: 0 },
    ]
    studentData.forEach(student => {
      if (student.total >= 90) distribution[0].count++
      else if (student.total >= 80) distribution[1].count++
      else if (student.total >= 70) distribution[2].count++
      else if (student.total >= 60) distribution[3].count++
      else distribution[4].count++
    })
    return distribution
  }, [])

  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="container mx-auto p-4 space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1
              className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              Subject Analysis
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
                disabled={!selectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
                disabled={!selectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={!selectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedSubject && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Class Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classAverage.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Out of 100</p>
                </CardContent>
              </Card>
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass Percentage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{passPercentage.toFixed(2)}%</div>
                  <Progress value={passPercentage} className="mt-2" />
                </CardContent>
              </Card>
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass/Fail Counts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{passFailCounts.pass}</div>
                      <p className="text-xs text-muted-foreground">Passed</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{passFailCounts.fail}</div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {topPerformers.map((student, index) => (
                      <li key={student.id} className="flex justify-between items-center">
                        <span>{student.name}</span>
                        <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                          {student.total}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Student Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">S.No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Internal</TableHead>
                      <TableHead className="text-center">External</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentData.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell className="text-center">{student.internal}</TableCell>
                        <TableCell className="text-center">{student.external}</TableCell>
                        <TableCell className="text-center">{student.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Marks Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marksDistribution}>
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeDistribution}>
                        <XAxis dataKey="grade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>)
  );
}