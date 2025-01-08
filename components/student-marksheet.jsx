'use client'

import * as React from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

export function StudentMarksheetComponent() {
  // State for dropdowns
  const [courses, setCourses] = React.useState([])
  const [semesters, setSemesters] = React.useState([])
  const [sessions, setSessions] = React.useState([])
  const [students, setStudents] = React.useState([])
  const [selectedCourse, setSelectedCourse] = React.useState("")
  const [selectedSemester, setSelectedSemester] = React.useState("")
  const [selectedSession, setSelectedSession] = React.useState("")
  const [selectedStudent, setSelectedStudent] = React.useState("")
  const [marksData, setMarksData] = React.useState(null)
  const [selectedCourseName, setSelectedCourseName] = React.useState("")

  // Fetch courses on component mount
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/course')
        setCourses(response.data)
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }
    fetchCourses()
  }, [])

  // Update semesters when course changes
  React.useEffect(() => {
    if (!selectedCourse) {
      setSemesters([])
      return
    }

    const selectedCourseData = courses.find(course => course._id === selectedCourse)
    if (selectedCourseData) {
      setSemesters(selectedCourseData.semester)
      setSelectedCourseName(selectedCourseData.name)
    }
  }, [selectedCourse, courses])

  // Fetch sessions when course and semester are selected
  React.useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedCourse || !selectedSemester) {
        setSessions([])
        return
      }

      try {
        const response = await axios.get(`/api/sessions`)
        // Filter sessions for the selected course
        const filteredSessions = response.data
          .filter(session => session.course._id === selectedCourse)
          .map(session => session.session)
        
        const uniqueSessions = [...new Set(filteredSessions)]
        setSessions(uniqueSessions)
      } catch (error) {
        console.error('Error fetching sessions:', error)
      }
    }
    fetchSessions()
  }, [selectedCourse, selectedSemester])

  // Fetch class details (students) when session is selected
  React.useEffect(() => {
    const fetchClassDetails = async () => {
      if (!selectedCourse || !selectedSemester || !selectedSession) {
        setStudents([])
        return
      }

      try {
        const response = await axios.get('/api/class', {
          params: {
            course: selectedCourse,
            semester: selectedSemester,
            session: selectedSession
          }
        })

        if (response.data[0]?.students) {
          setStudents(response.data[0].students)
        }
      } catch (error) {
        console.error('Error fetching class details:', error)
      }
    }
    fetchClassDetails()
  }, [selectedCourse, selectedSemester, selectedSession])

  // Fetch student marks when student is selected
  React.useEffect(() => {
    const fetchStudentMarks = async () => {
      if (!selectedStudent) {
        setMarksData(null)
        return
      }

      try {
        const selectedStudentData = students.find(s => s.rollNo === selectedStudent);
        if (!selectedStudentData) return;

        const response = await axios.get('/api/marks', {
          params: {
            course: selectedCourse,
            semester: selectedSemester,
            session: selectedSession,
            student: selectedStudent
          }
        })

        if (response.data) {
          setMarksData(response.data)
        }
      } catch (error) {
        console.error('Error fetching student marks:', error)
      }
    }
    fetchStudentMarks()
  }, [selectedStudent, selectedCourse, selectedSemester, selectedSession, students])

  const calculateTotal = (internal, external) => Number(internal) + Number(external)
  
  const calculatePercentage = () => {
    if (!marksData?.subjects?.length) return "0.00"
    const totalObtained = marksData.subjects.reduce((acc, subject) => 
      acc + Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks), 0)
    const totalMaximum = marksData.subjects.reduce((acc, subject) =>
      acc + Number(subject.internal_maxMarks) + Number(subject.external_maxMarks), 0)
    return ((totalObtained / totalMaximum) * 100).toFixed(2)
  }

  const getSubjectStrengthsWeaknesses = () => {
    if (!marksData?.subjects) return []
    return marksData.subjects.map(subject => {
      const totalObtained = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
      const totalMax = Number(subject.internal_maxMarks) + Number(subject.external_maxMarks)
      const percentage = (totalObtained / totalMax) * 100
      let status = percentage >= 80 ? 'Strength' : percentage < 60 ? 'Needs Improvement' : 'Average'
      return { 
        ...subject, 
        status, 
        percentage: percentage.toFixed(2) 
      }
    })
  }

  const chartData = marksData?.subjects?.map(subject => ({
    name: subject.subjectName,
    total: calculateTotal(subject.internal_obtainedMarks, subject.external_obtainedMarks),
    max: Number(subject.internal_maxMarks) + Number(subject.external_maxMarks)
  })) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="container mx-auto p-4 space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              Student Marksheet
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={selectedCourse} onValueChange={(value) => {
                setSelectedCourse(value)
                setSelectedSemester('')
                setSelectedSession('')
                setSelectedStudent('')
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSemester}
                onValueChange={(value) => {
                  setSelectedSemester(value)
                  setSelectedSession('')
                  setSelectedStudent('')
                }}
                disabled={!selectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSession}
                onValueChange={(value) => {
                  setSelectedSession(value)
                  setSelectedStudent('')
                }}
                disabled={!selectedSemester}>
                <SelectTrigger>
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

              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
                disabled={!selectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.rollNo} value={student.rollNo}>
                      {student.name} ({student.rollNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {marksData && marksData.subjects && (
              <div className="space-y-8">
                {/* Marksheet Details */}
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Marksheet Details</h2>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">Min</TableHead>
                            <TableHead className="text-center">Max</TableHead>
                            <TableHead className="text-center">Obt</TableHead>
                            <TableHead className="text-center">Min</TableHead>
                            <TableHead className="text-center">Max</TableHead>
                            <TableHead className="text-center">Obt</TableHead>
                            <TableHead className="text-center">Total Marks</TableHead>
                          </TableRow>
                          <TableRow>
                            <TableHead></TableHead>
                            <TableHead className="text-center" colSpan={3}>Continuous Internal Assessment (CIA)</TableHead>
                            <TableHead className="text-center" colSpan={3}>End Semester Examination (ESE)</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marksData.subjects.map((subject, index) => (
                            <TableRow key={index}>
                              <TableCell>{subject.subjectName}</TableCell>
                              <TableCell className="text-center">{subject.internal_minMarks}</TableCell>
                              <TableCell className="text-center">{subject.internal_maxMarks}</TableCell>
                              <TableCell className="text-center">{subject.internal_obtainedMarks}</TableCell>
                              <TableCell className="text-center">{subject.external_minMarks}</TableCell>
                              <TableCell className="text-center">{subject.external_maxMarks}</TableCell>
                              <TableCell className="text-center">{subject.external_obtainedMarks}</TableCell>
                              <TableCell className="text-center">
                                {calculateTotal(subject.internal_obtainedMarks, subject.external_obtainedMarks)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={7} className="text-right font-semibold">Total Marks:</TableCell>
                            <TableCell className="text-center font-semibold">
                              {marksData.subjects.reduce((acc, subject) => 
                                acc + calculateTotal(subject.internal_obtainedMarks, subject.external_obtainedMarks), 0
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={7} className="text-right font-semibold">Total Percentage:</TableCell>
                            <TableCell className="text-center font-semibold">{calculatePercentage()}%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Two Column Layout for Strengths/Weaknesses and Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Strengths and Weaknesses - Left Column */}
                  <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Subject-Specific Strengths and Weaknesses</h2>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSubjectStrengthsWeaknesses().map((subject, index) => (
                            <TableRow key={index}>
                              <TableCell>{subject.subjectName}</TableCell>
                              <TableCell>{subject.percentage}%</TableCell>
                              <TableCell className={
                                subject.status === 'Strength' ? 'text-green-600' :
                                subject.status === 'Needs Improvement' ? 'text-red-600' :
                                'text-yellow-600'
                              }>
                                {subject.status}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Performance Chart - Right Column */}
                  <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Performance Chart</h2>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total" fill="#3b82f6" name="Obtained" />
                            <Bar dataKey="max" fill="#93c5fd" name="Maximum" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}