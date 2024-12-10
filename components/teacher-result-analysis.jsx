'use client';
import * as React from 'react'
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Users, TrendingUp, PieChart as PieChartIcon, GraduationCap } from "lucide-react"

const departmentOptions = [
  { value: "computer-science", label: "Computer Science" },
  { value: "electronics", label: "Electronics" },
  { value: "mechanical", label: "Mechanical" },
]

const teacherData = {
  "computer-science": [
    {
      name: "Reekha Awathi",
      classes: [
        { name: "BCA 1ST YEAR", subject: "Operating System", passed: 45, failed: 7 },
        { name: "BCA 2ND YEAR", subject: "C++", passed: 50, failed: 4 },
      ],
    },
    {
      name: "John Doe",
      classes: [
        { name: "BCA 2ND YEAR", subject: "Data Structures", passed: 48, failed: 7 },
        { name: "BCA 3RD YEAR", subject: "Web Development", passed: 52, failed: 1 },
      ],
    },
  ],
}

const subjectPerformanceData = [
  { subject: "Operating System", average: 82, color: '#2B6CB0' },
  { subject: "C++", average: 88, color: '#3182CE' },
  { subject: "Data Structures", average: 75, color: '#4299E1' },
  { subject: "Web Development", average: 92, color: '#63B3ED' },
]

export function TeacherResultAnalysisComponent() {
  const [selectedDepartment, setSelectedDepartment] = React.useState("computer-science")
  const [selectedTeacher, setSelectedTeacher] = React.useState("")

  const teacherOptions = selectedDepartment && teacherData[selectedDepartment]
    ? teacherData[selectedDepartment].map(teacher => ({ value: teacher.name, label: teacher.name }))
    : []

  const selectedTeacherData = selectedTeacher
    ? teacherData[selectedDepartment].find(teacher => teacher.name === selectedTeacher)
    : null

  const studentDistribution = selectedTeacherData
    ? selectedTeacherData.classes.reduce((acc, cls) => {
      acc[0].value += cls.passed || 0;
      acc[1].value += cls.failed || 0;
      return acc;
    }, [
      { name: 'Pass', value: 0, color: '#4299E1' },
      { name: 'Fail', value: 0, color: '#90CDF4' },
    ])
    : [];

  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="container mx-auto p-4 space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1
              className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Teacher Result Analysis</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedTeacher}
                onValueChange={setSelectedTeacher}
                disabled={!selectedDepartment}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teacherOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedDepartment && teacherData[selectedDepartment] ? (
          selectedTeacherData ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">Total Students</CardTitle>
                    <Users className="h-6 w-6 text-blue-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {selectedTeacherData.classes.reduce((sum, cls) => sum + cls.passed + cls.failed, 0)}
                    </div>
                    <p className="text-sm text-blue-200">Across all classes</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">Pass Rate</CardTitle>
                    <GraduationCap className="h-6 w-6 text-blue-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {Math.round((selectedTeacherData.classes.reduce((sum, cls) => sum + cls.passed, 0) /
                        selectedTeacherData.classes.reduce((sum, cls) => sum + cls.passed + cls.failed, 0)) *
                        100)}%
                    </div>
                    <p className="text-sm text-blue-200">Overall pass percentage</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">Classes Taught</CardTitle>
                    <BookOpen className="h-6 w-6 text-blue-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{selectedTeacherData.classes.length}</div>
                    <p className="text-sm text-blue-200">Number of classes</p>
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
                      {studentDistribution.length > 0 ? (
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
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No data available</p>
                        </div>
                      )}
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
                      {subjectPerformanceData.length > 0 ? (
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
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Class-wise Results</CardTitle>
                  <CardDescription>Overview of performance in each class</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Passed</TableHead>
                        <TableHead>Failed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTeacherData.classes.map((cls, index) => (
                        <TableRow key={index}>
                          <TableCell>{cls.name}</TableCell>
                          <TableCell>{cls.subject}</TableCell>
                          <TableCell>
                            <Badge variant="success">{cls.passed}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{cls.failed}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Users className="h-16 w-16 text-blue-500 mb-6" />
                <h2 className="text-2xl font-semibold mb-2">Select a Teacher</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                  Choose a teacher from the dropdown above to view their result analysis.
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <BookOpen className="h-16 w-16 text-blue-500 mb-6" />
              <h2 className="text-2xl font-semibold mb-2">Select Department and Teacher</h2>
              <p className="text-muted-foreground text-center max-w-sm">
                Choose a department and teacher from the dropdowns above to view the result analysis.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>)
  );
}