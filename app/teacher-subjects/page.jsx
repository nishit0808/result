'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Save, Trash2 } from "lucide-react"
import { Toaster, toast } from 'sonner'

export default function TeacherSubjectsPage() {
  // State for department and teacher
  const [department, setDepartment] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [showSubjectSelections, setShowSubjectSelections] = useState(false)

  // State for sessions data
  const [allSessions, setAllSessions] = useState([])
  const [subjectSelections, setSubjectSelections] = useState([{
    course: '',
    semester: '',
    session: '',
    subject: '',
    id: Date.now()
  }])

  // State for filtered options
  const [availableCourses, setAvailableCourses] = useState([])
  const [availableSemesters, setAvailableSemesters] = useState({})
  const [availableSessions, setAvailableSessions] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState({})

  // Error and success messages
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const departments = [
    'Computer Science',
    'Science',
    'Education',
    'Commerce',
    'Management',
    'Art'
  ]

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

  // Fetch all sessions data
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/api/sessions')
        setAllSessions(response.data)
        
        // Extract unique courses
        const uniqueCourses = [...new Map(
          response.data.map(session => [session.course._id, session.course])
        ).values()]
        setAvailableCourses(uniqueCourses)
      } catch (error) {
        setErrorMessage('Failed to fetch sessions data')
      }
    }
    fetchSessions()
  }, [])

  // Handle teacher name input
  const handleTeacherNameKeyPress = (e) => {
    if (e.key === 'Enter' && teacherName.trim()) {
      setShowSubjectSelections(true)
    }
  }

  // Add new subject selection
  const addSubjectSelection = () => {
    setSubjectSelections([
      ...subjectSelections,
      {
        course: '',
        semester: '',
        session: '',
        subject: '',
        id: Date.now()
      }
    ])
  }

  // Remove subject selection
  const removeSubjectSelection = (index) => {
    setSubjectSelections(subjectSelections.filter((_, i) => i !== index))
  }

  // Update subject selection
  const updateSubjectSelection = (index, field, value) => {
    const newSelections = [...subjectSelections]
    newSelections[index] = {
      ...newSelections[index],
      [field]: value
    }

    if (field === 'course') {
      const selectedCourse = availableCourses.find(c => c._id === value)
      if (selectedCourse) {
        setAvailableSemesters({
          ...availableSemesters,
          [index]: selectedCourse.semester
        })
        newSelections[index].semester = ''
        newSelections[index].session = ''
        newSelections[index].subject = ''
      }
    }

    if (field === 'semester') {
      const courseId = newSelections[index].course
      const semester = value
      const relevantSessions = allSessions.filter(session => 
        session.course._id === courseId && 
        session.semester === semester
      )
      const sessions = [...new Set(relevantSessions.map(s => s.session))]
      setAvailableSessions({
        ...availableSessions,
        [index]: sessions
      })
      newSelections[index].session = ''
      newSelections[index].subject = ''
    }

    if (field === 'session') {
      const courseId = newSelections[index].course
      const semester = newSelections[index].semester
      const session = value
      const matchingSession = allSessions.find(s => 
        s.course._id === courseId && 
        s.semester === semester && 
        s.session === session
      )
      if (matchingSession) {
        setAvailableSubjects({
          ...availableSubjects,
          [index]: matchingSession.ssubjects
        })
      }
      newSelections[index].subject = ''
    }

    setSubjectSelections(newSelections)
  }

  // Submit teacher details
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    if (!department || !teacherName || subjectSelections.some(s => 
      !s.course || !s.semester || !s.session || !s.subject)) {
      toast.error('Please fill all fields')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Saving teacher details...')

    try {
      await axios.post('/api/teacher', {
        name: teacherName,
        department,
        subjects: subjectSelections.map(s => ({
          course: s.course,
          semester: s.semester,
          session: s.session,
          subject: s.subject
        }))
      })
      
      toast.dismiss(loadingToast)
      toast.success('Teacher details saved successfully', {
        description: 'Redirecting to marks entry...',
        duration: 2000,
      })

      // Reset form and redirect after delay
      setTimeout(() => {
        setTeacherName('')
        setDepartment('')
        setShowSubjectSelections(false)
        setSubjectSelections([{
          course: '',
          semester: '',
          session: '',
          subject: '',
          id: Date.now()
        }])
        window.location.href = '/marks'
      }, 2000)
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Failed to save teacher details', {
        description: error.response?.data?.message || error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800 p-4">
      <Toaster position="top-center" expand={true} richColors />
      <div className="container mx-auto space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Teacher Subject Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Initial Selection Section */}
              <div className="space-y-2 p-4 border border-gray-200 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department Selection */}
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Teacher Name Input */}
                  <div className="space-y-2">
                    <Label>Teacher Name</Label>
                    <Input
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      onKeyPress={handleTeacherNameKeyPress}
                      placeholder="Enter teacher name and press Enter"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Selections */}
              {showSubjectSelections && (
                <>
                  {subjectSelections.map((selection, index) => (
                    <div key={selection.id} className="space-y-2 p-4 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Subject {index + 1}</h3>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeSubjectSelection(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Course Selection */}
                        <div className="space-y-2">
                          <Label>Course</Label>
                          <Select
                            value={selection.course}
                            onValueChange={(value) => updateSubjectSelection(index, 'course', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCourses.map(course => (
                                <SelectItem key={course._id} value={course._id}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Semester Selection */}
                        <div className="space-y-2">
                          <Label>Semester</Label>
                          <Select
                            value={selection.semester}
                            onValueChange={(value) => updateSubjectSelection(index, 'semester', value)}
                            disabled={!selection.course}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSemesters[index]?.map(sem => (
                                <SelectItem key={sem} value={sem}>
                                  {sem}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Session Selection */}
                        <div className="space-y-2">
                          <Label>Session</Label>
                          <Select
                            value={selection.session}
                            onValueChange={(value) => updateSubjectSelection(index, 'session', value)}
                            disabled={!selection.semester}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Session" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSessions[index]?.map(session => (
                                <SelectItem key={session} value={session}>
                                  {session}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Subject Selection */}
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Select
                            value={selection.subject}
                            onValueChange={(value) => updateSubjectSelection(index, 'subject', value)}
                            disabled={!selection.session}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSubjects[index]?.map(subject => (
                                <SelectItem key={subject._id} value={subject.name}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSubjectSelection}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Another Subject
                  </Button>

                  {/* Submit Button */}
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Teacher Details"}
                  </Button>
                </>
              )}

              {/* Messages */}
              {errorMessage && (
                <div className="p-4 text-red-500 bg-red-50 rounded-md text-center">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-4 text-green-500 bg-green-50 rounded-md text-center">
                  {successMessage}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
