'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function MarksEntryPage() {
  // State for dropdowns
  const [courses, setCourses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedCourseName, setSelectedCourseName] = useState('')

  // State for students and subjects
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [marks, setMarks] = useState([])

  // Error and success messages
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Clear messages after 3 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('')
        setSuccessMessage('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage, successMessage])

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/course')
        setCourses(response.data)
      } catch (error) {
        console.error('Error fetching courses:', error)
        setErrorMessage('Failed to load courses')
      }
    }
    fetchCourses()
  }, [])

  

  // Update semesters when course changes
  useEffect(() => {
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
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedCourse || !selectedSemester) {
        setSessions([])
        return
      }

      try {
        const response = await axios.get('/api/sessions')
        const filteredSessions = response.data
          .filter(session => session.course._id === selectedCourse)
          .map(session => session.session)
        
        const uniqueSessions = [...new Set(filteredSessions)]
        setSessions(uniqueSessions)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        setErrorMessage('Failed to load sessions')
      }
    }
    fetchSessions()
  }, [selectedCourse, selectedSemester])

  // Fetch class details and subjects when all selections are made
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!selectedCourse || !selectedSemester || !selectedSession) {
        setStudents([])
        return
      }

      try {
        console.log('Fetching class details with:', {
          course: selectedCourse,
          semester: selectedSemester,
          session: selectedSession
        })

        const response = await axios.get('/api/class', {
          params: {
            course: selectedCourse,
            semester: selectedSemester,
            session: selectedSession
          }
        })

        console.log('Response from /api/class:', response.data[0])

        if (response.data[0].students ) {
          setStudents(response.data[0].students)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('Error fetching class details:', error.response?.data || error.message)
        setErrorMessage(error.response?.data?.error || 'Failed to load class details')
        setStudents([])
      }
    }
    fetchClassDetails()
  }, [selectedCourse, selectedSemester, selectedSession])

  // Handle subjects fetching
  useEffect(() => {
    console.log(`/api/sessions?course=${selectedCourseName}&semester=${selectedSemester}&session=${selectedSession}`)
    axios.get(`/api/sessions?course=${selectedCourseName}&semester=${selectedSemester}&session=${selectedSession}`)
      .then(response => {
        setSubjects(response.data)
      })
      .catch(error => {
        console.error('Error fetching subjects:', error)
        setErrorMessage('Failed to load subjects')
      })
  }, [selectedSession])

  useEffect(() => {
    console.log('Subjects:', subjects)
  }, [subjects])

  // Handle marks input change
  const handleMarksChange = (index, field, value) => {
    const newMarks = [...marks];
    newMarks[index] = {
      ...newMarks[index],
      [field]: value
    };
    setMarks(newMarks);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedStudent || marks.some(mark => 
      mark.internal_obtainedMarks === '' || 
      mark.external_obtainedMarks === ''
    )) {
      setErrorMessage('Please fill in all marks')
      return
    }

    // Validate only maximum marks
    for (const mark of marks) {
      if (
        Number(mark.internal_obtainedMarks) > mark.internal_maxMarks ||
        Number(mark.external_obtainedMarks) > mark.external_maxMarks
      ) {
        setErrorMessage('Marks cannot exceed maximum limits')
        return
      }
    }

    try {
      const marksData = marks.map(mark => ({
        subjectName: mark.subjectName,
        internal_minMarks: Number(mark.internal_minMarks),
        internal_maxMarks: Number(mark.internal_maxMarks),
        internal_obtainedMarks: Number(mark.internal_obtainedMarks),
        external_minMarks: Number(mark.external_minMarks),
        external_maxMarks: Number(mark.external_maxMarks),
        external_obtainedMarks: Number(mark.external_obtainedMarks)
      }));

      await axios.post('/api/marks', {
        course: selectedCourse,
        semester: selectedSemester,
        session: selectedSession,
        student: selectedStudent,
        subjects: marksData
      });

      setSuccessMessage('Marks saved successfully')
      setSelectedStudent('')
      setMarks([])
    } catch (error) {
      console.error('Error saving marks:', error)
      setErrorMessage('Failed to save marks')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800 p-4">
      <div className="container mx-auto">
        {/* Error and Success Messages */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Enter Student Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Selection Section */}
              <div className="space-y-2 p-4 border border-gray-200 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Course Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Course</label>
                    <Select 
                      value={selectedCourse} 
                      onValueChange={(value) => {
                        setSelectedCourse(value)
                        setSelectedSemester('')
                        setSelectedSession('')
                        setSelectedStudent('')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Semester Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Semester</label>
                    <Select 
                      value={selectedSemester} 
                      onValueChange={(value) => {
                        setSelectedSemester(value)
                        setSelectedSession('')
                        setSelectedStudent('')
                      }}
                      disabled={!selectedCourse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Session</label>
                    <Select 
                      value={selectedSession} 
                      onValueChange={(value) => {
                        setSelectedSession(value)
                        setSelectedStudent('')
                      }}
                      disabled={!selectedCourse || !selectedSemester}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Session" />
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

                  {/* Student Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Student</label>
                    <Select 
                      value={selectedStudent} 
                      onValueChange={setSelectedStudent}
                      disabled={!selectedCourse || !selectedSemester || !selectedSession}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.uid} value={student.uid}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Marks Entry Section */}
              {selectedStudent && subjects.length > 0 && (
                <div className="space-y-2 p-4 border border-gray-200 rounded-md">
                  <Table className="w-full border-collapse border border-gray-300">
                    <TableHeader>
                      {/* First Row */}
                      <TableRow className="border border-gray-300">
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center" rowSpan={2}>
                          Subjects
                        </TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center" colSpan={3}>
                          Internal
                        </TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center" colSpan={3}>
                          External
                        </TableHead>
                      </TableRow>
                      {/* Second Row */}
                      <TableRow className="border border-gray-300">
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Min</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Max</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Marks</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Min</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Max</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Marks</TableHead>
                      </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody>
                      {subjects[0].ssubjects.map((subject, index) => {
                        // Initialize marks array with subject details if not already done
                        if (marks.length === 0 || !marks[index]) {
                          const newMarks = [...marks];
                          newMarks[index] = {
                            subjectName: subject.name,
                            internal_minMarks: subject.internal_minMarks,
                            internal_maxMarks: subject.internal_maxMarks,
                            external_minMarks: subject.external_minMarks,
                            external_maxMarks: subject.external_maxMarks,
                            internal_obtainedMarks: '',
                            external_obtainedMarks: ''
                          };
                          setMarks(newMarks);
                        }
                        
                        return (
                          <TableRow key={index} className="border border-gray-300">
                            <TableCell className="border border-gray-300">{subject.name}</TableCell>
                            <TableCell className="border border-gray-300">
                              {subject.internal_minMarks}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              {subject.internal_maxMarks}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              <Input
                                type="number"
                                value={marks[index]?.internal_obtainedMarks || ''}
                                onChange={(e) =>
                                  handleMarksChange(index, "internal_obtainedMarks", e.target.value)
                                }
                                min={subject.internal_minMarks}
                                max={subject.internal_maxMarks}
                              />
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              {subject.external_minMarks}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              {subject.external_maxMarks}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              <Input
                                type="number"
                                value={marks[index]?.external_obtainedMarks || ''}
                                onChange={(e) =>
                                  handleMarksChange(index, "external_obtainedMarks", e.target.value)
                                }
                                min={subject.external_minMarks}
                                max={subject.external_maxMarks}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <Button
                    onClick={handleSubmit}
                    className="w-full mt-4"
                    disabled={!marks.length}
                  >
                    Save Marks
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
