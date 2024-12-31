'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import * as XLSX from 'xlsx'
import { FileUp } from "lucide-react"
import { ArrowRight } from "lucide-react"

export default function EnterClassPage() {
  // State for dropdowns
  const [courses, setCourses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedCourseName, setSelectedCourseName] = useState('') // Store course name for display

  // Student form state
  const [students, setStudents] = useState([])
  const [newStudent, setNewStudent] = useState({
    uid: '',
    enrollmentNo: '',
    name: ''
  })

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
        const response = await axios.get(`/api/sessions`)
        // Filter sessions for the selected course
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

  // Handle adding a new student
  const handleAddStudent = () => {
    if (!newStudent.uid || !newStudent.enrollmentNo || !newStudent.name) {
      setErrorMessage('Please fill in all student details')
      return
    }

    const isDuplicate = students.some(
      student => student.uid === newStudent.uid || 
                 student.enrollmentNo === newStudent.enrollmentNo
    )

    if (isDuplicate) {
      setErrorMessage('Student with this UID or Enrollment No. already exists')
      return
    }

    setStudents([...students, newStudent])
    setNewStudent({ uid: '', enrollmentNo: '', name: '' })
    setSuccessMessage('Student added successfully')
  }

  // Handle removing a student
  const handleRemoveStudent = (indexToRemove) => {
    setStudents(students.filter((_, index) => index !== indexToRemove))
    setSuccessMessage('Student removed successfully')
  }

  // Handle Excel file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Validate and format the data
        const validStudents = jsonData.map(row => ({
          uid: String(row.uid || row.UID || row.Uid || ''),
          enrollmentNo: String(row.enrollmentNo || row.enrollment_no || row.EnrollmentNo || row['Enrollment No.'] || ''),
          name: String(row.name || row.Name || '')
        })).filter(student => student.uid && student.enrollmentNo && student.name)

        if (validStudents.length === 0) {
          setErrorMessage('No valid student data found in Excel file. Please ensure columns are named: uid, enrollmentNo, name')
          return
        }

        // Check for duplicates with existing students
        const newStudents = validStudents.filter(newStudent => 
          !students.some(existingStudent => 
            existingStudent.uid === newStudent.uid || 
            existingStudent.enrollmentNo === newStudent.enrollmentNo
          )
        )

        if (newStudents.length === 0) {
          setErrorMessage('All students from Excel file already exist in the list')
          return
        }

        setStudents([...students, ...newStudents])
        setSuccessMessage(`Successfully added ${newStudents.length} students from Excel file`)
        e.target.value = null // Reset file input
      } catch (error) {
        console.error('Error processing Excel file:', error)
        setErrorMessage('Error processing Excel file. Please ensure it\'s a valid Excel file with proper columns')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedCourse || !selectedSemester || !selectedSession) {
      setErrorMessage('Please select all required fields')
      return
    }

    if (students.length === 0) {
      setErrorMessage('Please add at least one student')
      return
    }

    try {
      const response = await axios.post('/api/class', {
        course: selectedCourse,
        semester: selectedSemester,
        session: selectedSession,
        students: students
      })

      setSuccessMessage('Class details saved successfully')
      
      // Reset form
      setSelectedCourse('')
      setSelectedSemester('')
      setSelectedSession('')
      setStudents([])
    } catch (error) {
      console.error('Error saving class details:', error)
      setErrorMessage(error.response?.data?.error || 'Failed to save class details')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800 p-4">
      <div className="container mx-auto space-y-6">
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
            <CardTitle className="text-2xl font-bold text-center">Enter Class Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2 p-4 border border-gray-200 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Course Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Course</label>
                    <Select 
                      value={selectedCourse} 
                      onValueChange={(value) => {
                        setSelectedCourse(value)
                        setSelectedSemester('')
                        setSelectedSession('')
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
                      onValueChange={setSelectedSession}
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
                </div>
              </div>

              {/* Student Entry Form */}
              <div className="space-y-2 p-4 border border-gray-200 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input 
                    placeholder="UID" 
                    value={newStudent.uid}
                    onChange={(e) => setNewStudent({...newStudent, uid: e.target.value})}
                  />
                  <Input 
                    placeholder="Enrollment No." 
                    value={newStudent.enrollmentNo}
                    onChange={(e) => setNewStudent({...newStudent, enrollmentNo: e.target.value})}
                  />
                  <Input 
                    placeholder="Name" 
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  />
                  <Button onClick={handleAddStudent} className="w-full">Add Student</Button>
                </div>

                {/* Excel Upload Section */}
                <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
                  <div className="text-center">
                    <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                        <span>Upload Excel file</span>
                        <Input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">Excel files only (.xlsx, .xls)</p>
                  </div>
                </div>
              </div>

              {/* Student List */}
              {students.length > 0 && (
                <div className="space-y-2 p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-semibold mb-4">Students - {selectedCourseName} {selectedSemester}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>UID</TableHead>
                        <TableHead>Enrollment No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>{student.uid}</TableCell>
                          <TableCell>{student.enrollmentNo}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRemoveStudent(index)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                onClick={handleSubmit} 
                disabled={!selectedCourse || !selectedSemester || !selectedSession || students.length === 0}
                className="w-full"
              >
                Submit Class Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <Button
              type="button"
              onClick={() => window.location.href = '/marks'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
            >
              Enter the Marks <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
