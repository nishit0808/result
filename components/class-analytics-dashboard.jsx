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

export function ClassAnalyticsDashboardComponent() {
  const [courses, setCourses] = React.useState([])
  const [sessions, setSessions] = React.useState([])
  const [selectedClass, setSelectedClass] = React.useState("")
  const [selectedSemester, setSelectedSemester] = React.useState("")
  const [selectedSession, setSelectedSession] = React.useState("")
  const [selectedCourseIndex, setSelectedCourseIndex] = React.useState("")
  const [studentResults, setStudentResults] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [analytics, setAnalytics] = React.useState({
    classAverage: 0,
    topScore: 0,
    needSupport: 0,
    distribution: {
      pass: 0,
      supply: 0,
      fail: 0
    },
    topPerformers: [],
    needsImprovement: [],
    subjectPerformance: []
  })

  // Helper function to format percentage
  const formatPercentage = (value) => Number(value.toFixed(2))

  // Fetch courses on mount
  React.useEffect(() => {
    axios
      .get(`/api/course`)
      .then((res) =>
        setCourses(res.data)
      )
      .catch((err) => console.log(err))
  }, [])

  // Update course index when class changes
  React.useEffect(() => {
    const selectedCourse = courses.findIndex((course) => course.name === selectedClass)
    setSelectedCourseIndex(selectedCourse)
    // Reset dependent fields
    setSelectedSemester("")
    setSelectedSession("")
  }, [selectedClass])

  // Fetch sessions when course and semester are selected
  React.useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedClass || !selectedSemester) {
        setSessions([])
        return
      }

      try {
        const selectedCourseData = courses.find(course => course.name === selectedClass)
        if (!selectedCourseData) return

        const response = await axios.get('/api/sessions')
        const filteredSessions = response.data
          .filter(session => session.course._id === selectedCourseData._id)
          .map(session => session.session)
        
        const uniqueSessions = [...new Set(filteredSessions)]
        setSessions(uniqueSessions)
      } catch (error) {
        console.error('Error fetching sessions:', error)
      }
    }
    fetchSessions()
  }, [selectedClass, selectedSemester, courses])

  // Fetch student results when all selections are made
  React.useEffect(() => {
    const fetchStudentResults = async () => {
      if (!selectedClass || !selectedSemester || !selectedSession) {
        setStudentResults([])
        return
      }

      setLoading(true)
      try {
        const selectedCourseData = courses.find(course => course.name === selectedClass)
        if (!selectedCourseData) return

        // First get all students in the class
        const classResponse = await axios.get('/api/class', {
          params: {
            course: selectedCourseData._id,
            semester: selectedSemester,
            session: selectedSession
          }
        })

        if (!classResponse.data[0]?.students) {
          throw new Error('No students found in class')
        }

        // For each student, fetch their marks
        const studentsWithMarks = await Promise.all(
          classResponse.data[0].students.map(async (student) => {
            try {
              const marksResponse = await axios.get('/api/marks', {
                params: {
                  course: selectedCourseData._id,
                  semester: selectedSemester,
                  session: selectedSession,
                  student: student.uid
                }
              })

              if (!marksResponse.data?.subjects) return null

              return {
                name: student.name,
                course: selectedCourseData._id,
                semester: selectedSemester,
                session: selectedSession,
                subjects: marksResponse.data.subjects
              }
            } catch (error) {
              console.error(`Error fetching marks for student ${student.name}:`, error)
              return null
            }
          })
        )

        // Filter out null results
        const validResults = studentsWithMarks.filter(result => result !== null)
        setStudentResults(validResults)
      } catch (error) {
        console.error('Error fetching student results:', error)
        setStudentResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudentResults()
  }, [selectedClass, selectedSemester, selectedSession, courses])

  // Clear analytics when selections change
  React.useEffect(() => {
    setAnalytics({
      classAverage: 0,
      topScore: 0,
      needSupport: 0,
      distribution: { pass: 0, supply: 0, fail: 0 },
      topPerformers: [],
      needsImprovement: [],
      subjectPerformance: []
    })
  }, [selectedClass, selectedSemester, selectedSession])

  // Calculate analytics from student results
  React.useEffect(() => {
    if (studentResults.length === 0 || !selectedClass || !selectedSemester || !selectedSession) {
      return
    }

    // Get the selected course data
    const selectedCourseData = courses.find(course => course.name === selectedClass)
    if (!selectedCourseData) return

    // Filter students for current selection first
    const currentStudents = studentResults.filter(student => 
      student.course === selectedCourseData._id && 
      student.semester === selectedSemester && 
      student.session === selectedSession
    )

    if (currentStudents.length === 0) return

    // Calculate class average from filtered students
    const totalPercentage = currentStudents.reduce((acc, student) => {
      const totalMarks = student.subjects.reduce((acc, subject) => {
        return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
      }, 0)

      const totalMaxMarks = student.subjects.reduce((acc, subject) => {
        return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
      }, 0)

      const percentage = (totalMarks / totalMaxMarks) * 100
      return acc + percentage
    }, 0)

    const classAverage = formatPercentage(totalPercentage / currentStudents.length)

    // Find top score
    const topScore = formatPercentage(Math.max(...currentStudents.map(student => {
      const totalMarks = student.subjects.reduce((acc, subject) => {
        return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
      }, 0)

      const totalMaxMarks = student.subjects.reduce((acc, subject) => {
        return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
      }, 0)

      return (totalMarks / totalMaxMarks) * 100
    })))

    // Count students needing support (below 70%)
    const needSupport = currentStudents.filter(student => {
      const totalMarks = student.subjects.reduce((acc, subject) => {
        return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
      }, 0)

      const totalMaxMarks = student.subjects.reduce((acc, subject) => {
        return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
      }, 0)

      const percentage = (totalMarks / totalMaxMarks) * 100
      return percentage < 70
    }).length

    // Calculate distribution
    const distribution = {
      pass: currentStudents.filter(student => {
        const totalMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
        }, 0)

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
        }, 0)

        const percentage = (totalMarks / totalMaxMarks) * 100

        const failedSubjects = student.subjects.filter(subject => {
          const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
          const minTotal = Number(subject.internal_minMarks) + Number(subject.external_minMarks)
          return total < minTotal
        })

        let division = "Pass"
        if (failedSubjects.length > 0) {
          division = failedSubjects.length > 2 ? "Fail" : "Supply"
        }

        return division === "Pass"
      }).length,
      supply: currentStudents.filter(student => {
        const totalMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
        }, 0)

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
        }, 0)

        const percentage = (totalMarks / totalMaxMarks) * 100

        const failedSubjects = student.subjects.filter(subject => {
          const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
          const minTotal = Number(subject.internal_minMarks) + Number(subject.external_minMarks)
          return total < minTotal
        })

        let division = "Pass"
        if (failedSubjects.length > 0) {
          division = failedSubjects.length > 2 ? "Fail" : "Supply"
        }

        return division === "Supply"
      }).length,
      fail: currentStudents.filter(student => {
        const totalMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
        }, 0)

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
        }, 0)

        const percentage = (totalMarks / totalMaxMarks) * 100

        const failedSubjects = student.subjects.filter(subject => {
          const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
          const minTotal = Number(subject.internal_minMarks) + Number(subject.external_minMarks)
          return total < minTotal
        })

        let division = "Pass"
        if (failedSubjects.length > 0) {
          division = failedSubjects.length > 2 ? "Fail" : "Supply"
        }

        return division === "Fail"
      }).length
    }

    // Get top 3 performers
    const topPerformers = currentStudents
      .map(student => {
        const totalMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
        }, 0)

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
        }, 0)

        return {
          ...student,
          percentage: formatPercentage((totalMarks / totalMaxMarks) * 100)
        }
      })
      .filter(student => {
        const failedSubjects = student.subjects.filter(subject => {
          const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
          const minTotal = Number(subject.internal_minMarks) + Number(subject.external_minMarks)
          return total < minTotal
        })

        let division = "Pass"
        if (failedSubjects.length > 0) {
          division = failedSubjects.length > 2 ? "Fail" : "Supply"
        }

        return division === "Pass"
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
      .map(student => ({
        name: student.name,
        average: student.percentage,
        trend: "up", // You could make this dynamic by comparing with previous results
        change: "+2%" // You could calculate this from historical data
      }))

    // Get bottom 3 performers who haven't failed
    const needsImprovement = currentStudents
      .map(student => {
        const totalMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
        }, 0)

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
        }, 0)

        return {
          ...student,
          percentage: formatPercentage((totalMarks / totalMaxMarks) * 100)
        }
      })
      .filter(student => {
        const total = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
        }, 0)

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
        }, 0)

        const percentage = (total / totalMaxMarks) * 100

        const failedSubjects = student.subjects.filter(subject => {
          const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
          const minTotal = Number(subject.internal_minMarks) + Number(subject.external_minMarks)
          return total < minTotal
        })

        let division = "Pass"
        if (failedSubjects.length > 0) {
          division = failedSubjects.length > 2 ? "Fail" : "Supply"
        }

        return percentage < 70 && division !== "Fail"
      })
      .slice(0, 3)
      .map(student => ({
        name: student.name,
        average: student.percentage,
        failedSubjects: student.subjects.filter(subject => {
          const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
          const minTotal = Number(subject.internal_minMarks) + Number(subject.external_minMarks)
          return total < minTotal
        }).length
      }))

    // Calculate subject performance only for the current course, semester, and session
    const subjectsMap = new Map()

    // First pass: Collect total marks and count for each subject
    currentStudents.forEach(student => {
      if (!student.subjects) return

      student.subjects.forEach(subject => {
        const totalMarks = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
        const maxMarks = Number(subject.internal_maxMarks) + Number(subject.external_maxMarks)
        const percentage = formatPercentage((totalMarks / maxMarks) * 100)

        if (!subjectsMap.has(subject.subjectName)) {
          subjectsMap.set(subject.subjectName, {
            totalPercentage: percentage,
            count: 1,
            maxMarks: maxMarks
          })
        } else {
          const current = subjectsMap.get(subject.subjectName)
          subjectsMap.set(subject.subjectName, {
            totalPercentage: current.totalPercentage + percentage,
            count: current.count + 1,
            maxMarks: maxMarks
          })
        }
      })
    })

    // Second pass: Calculate averages and create final array
    const subjectPerformance = Array.from(subjectsMap.entries()).map(([subject, data], index) => ({
      subject,
      average: formatPercentage(data.totalPercentage / data.count),
      maxMarks: data.maxMarks,
      color: `hsl(${210 + (index * 30)}, 70%, 50%)`
    }))

    // Sort subjects by average performance
    subjectPerformance.sort((a, b) => b.average - a.average)

    setAnalytics(prev => ({
      ...prev,
      classAverage,
      topScore,
      needSupport,
      distribution,
      topPerformers,
      needsImprovement,
      subjectPerformance
    }))
  }, [studentResults, selectedClass, selectedSemester, selectedSession, courses])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="container mx-auto p-4 space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1
              className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Class Analytics Dashboard</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select 
                value={selectedClass} 
                onValueChange={(value) => {
                  setSelectedClass(value)
                }}>
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

              <Select 
                value={selectedSemester} 
                onValueChange={(value) => {
                  setSelectedSemester(value)
                  setSelectedSession("")
                }}
                disabled={!selectedClass}>
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

              <Select
                value={selectedSession}
                onValueChange={setSelectedSession}
                disabled={!selectedSemester}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session} value={session}>
                      {session}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedClass && selectedSemester && selectedSession ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Class Average</CardTitle>
                  <BookOpen className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.classAverage}%</div>
                  <p className="text-sm text-blue-200">Overall class performance</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Top Score</CardTitle>
                  <Trophy className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.topScore}%</div>
                  <p className="text-sm text-blue-200">Highest percentage achieved</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Need Support</CardTitle>
                  <AlertTriangle className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.needSupport}</div>
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
                          data={[
                            { name: 'Pass', value: analytics.distribution.pass, color: '#4299E1' },
                            { name: 'Supplementary', value: analytics.distribution.supply, color: '#63B3ED' },
                            { name: 'Fail', value: analytics.distribution.fail, color: '#90CDF4' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value">
                          {[
                            { name: 'Pass', value: analytics.distribution.pass, color: '#4299E1' },
                            { name: 'Supplementary', value: analytics.distribution.supply, color: '#63B3ED' },
                            { name: 'Fail', value: analytics.distribution.fail, color: '#90CDF4' }
                          ].map((entry, index) => (
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
                  <CardDescription>Average performance by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-blue-500">Loading subject data...</div>
                    </div>
                  ) : analytics.subjectPerformance.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-gray-500">No subject data available</div>
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.subjectPerformance}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <YAxis
                            dataKey="subject"
                            type="category"
                            width={90}
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Average']}
                            labelStyle={{ color: 'black' }}
                          />
                          <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                            {analytics.subjectPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Student Results Overview</CardTitle>
                <CardDescription>Overview of student performance and divisions</CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-blue-500">Loading results...</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left p-4 pl-8 text-gray-600 font-semibold w-1/5">Name</th>
                          <th className="text-right p-4 text-gray-600 font-semibold w-1/5">Total Marks</th>
                          <th className="text-right p-4 text-gray-600 font-semibold w-1/5">Percentage</th>
                          <th className="text-center p-4 text-gray-600 font-semibold w-1/5">Division</th>
                          <th className="text-right p-4 pr-8 text-gray-600 font-semibold w-1/5">Failed Subjects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentResults.map((result, index) => {
                          const totalMarks = result.subjects.reduce((acc, subject) => {
                            return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
                          }, 0)

                          const totalMaxMarks = result.subjects.reduce((acc, subject) => {
                            return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
                          }, 0)

                          const percentage = formatPercentage((totalMarks / totalMaxMarks) * 100)
                          const failedSubjects = result.subjects.reduce((acc, subject) => {
                            const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
                            const minTotal = Number(subject.internal_minMarks) + Number(subject.external_minMarks)
                            return total < minTotal ? acc + 1 : acc
                          }, 0)

                          const division = failedSubjects > 2 ? "Fail" : failedSubjects > 0 ? "Supply" : "Pass"
                          const badgeColor = division === "Pass" ? "bg-green-500" : division === "Supply" ? "bg-yellow-500" : "bg-red-500"

                          return (
                            <tr 
                              key={index}
                              className="border-b border-gray-100 hover:bg-gray-50/50"
                            >
                              <td className="p-4 pl-8 font-medium">{result.name}</td>
                              <td className="p-4 text-right">{totalMarks}</td>
                              <td className="p-4 text-right">{percentage}%</td>
                              <td className="p-4 text-center">
                                <span className={`${badgeColor} text-white px-4 py-1 rounded-full text-sm font-medium`}>
                                  {division}
                                </span>
                              </td>
                              <td className="p-4 pr-8 text-right">{failedSubjects}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Top Performers</CardTitle>
                  <CardDescription>Students with exceptional performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topPerformers.map((student, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.average}% Average</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {student.trend === "up" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={student.trend === "up" ? "text-green-500" : "text-red-500"}>
                            {student.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Needs Improvement</CardTitle>
                  <CardDescription>Students requiring additional support</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.needsImprovement.map((student, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.average}% Average</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {student.failedSubjects} subjects below passing
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
              <h2 className="text-2xl font-semibold mb-2">Select Class, Semester and Session</h2>
              <p className="text-muted-foreground text-center max-w-sm">
                Choose a class, semester and session from the dropdowns above to view the analytics dashboard.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}