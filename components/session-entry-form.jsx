'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, ArrowRight } from "lucide-react"
import { Toaster, toast } from 'sonner'

const subjectTypes = ['DSC', 'DSE', 'GE', 'AEC', 'SEC', 'VAC', 'XXX', 'None']

export default function SessionEntryForm() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [session, setSession] = useState('')
  const [subjects, setSubjects] = useState([
    {
      name: '',
      type: '',
      internal_minMarks: '',
      internal_maxMarks: '',
      external_minMarks: '',
      external_maxMarks: '',
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/course')
        setCourses(response.data || [])
      } catch (error) {
        console.error('Error fetching courses:', error.response?.data || error.message)
        toast.error('Failed to fetch courses')
      }
    }
    fetchCourses()
  }, [])

  // Update semesters when a course is selected
  useEffect(() => {
    if (selectedCourse) {
      const course = courses.find(c => c._id === selectedCourse)
      setSemesters(course?.semester || [])
    } else {
      setSemesters([])
    }
  }, [selectedCourse, courses])

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects]
    newSubjects[index][field] = value
    setSubjects(newSubjects)
  }

  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        name: '',
        type: '',
        internal_minMarks: '',
        internal_maxMarks: '',
        external_minMarks: '',
        external_maxMarks: '',
      },
    ])
  }

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      const newSubjects = subjects.filter((_, i) => i !== index)
      setSubjects(newSubjects)
    }
  }

  const handlesemesterChange = (e) => {
    setSelectedSemester(e)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Show loading toast
    const loadingToast = toast.loading('Saving session details...')

    try {
      // Validate required fields
      if (!selectedCourse || !selectedSemester || !session) {
        toast.error('Please fill in all required fields')
        return
      }

      // Validate subjects
      for (const subject of subjects) {
        if (!subject.name || !subject.type || 
            !subject.internal_minMarks || !subject.internal_maxMarks ||
            !subject.external_minMarks || !subject.external_maxMarks) {
          toast.error('Please fill in all subject details')
          return
        }
      }

      const formattedSubjects = subjects.map(subject => ({
        name: subject.name,
        type: subject.type,
        internal_minMarks: Number(subject.internal_minMarks),
        internal_maxMarks: Number(subject.internal_maxMarks),
        external_minMarks: Number(subject.external_minMarks),
        external_maxMarks: Number(subject.external_maxMarks),
      }))

      const payload = {
        course: selectedCourse,
        semester: selectedSemester,
        session: session,
        ssubjects: formattedSubjects,
      }

      await axios.post('/api/sessions', payload)
      
      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToast)
      toast.success('Session details saved successfully', {
        description: 'Redirecting to class entry...',
        duration: 2000,
      })

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/enter-class'
      }, 2000)
    } catch (error) {
      // Dismiss loading toast and show error toast
      toast.dismiss(loadingToast)
      toast.error('Failed to save session details', {
        description: error.response?.data?.message || error.message,
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
            <CardTitle className="text-2xl font-bold text-center">Enter Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Selection */}
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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
              </div>

              {/* Semester Selection */}
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={selectedSemester}
                  onValueChange={handlesemesterChange}
                  disabled={!selectedCourse}
                >
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
              </div>

              {/* Session Input */}
              <div className="space-y-2">
                <Label>Session</Label>
                <Input
                  placeholder="e.g., 2023-2024"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  required
                />
              </div>

              {/* Subjects */}
              <div className="space-y-4">
                <Label>Subjects</Label>
                {subjects.map((subject, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Subject {index + 1}</h3>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeSubject(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4">
                      {/* Subject Name */}
                      <div className="space-y-2">
                        <Label>Subject Name</Label>
                        <Input
                          placeholder="Enter subject name"
                          value={subject.name}
                          onChange={(e) =>
                            handleSubjectChange(index, 'name', e.target.value)
                          }
                          required
                        />
                      </div>

                      {/* Subject Type */}
                      <div className="space-y-2">
                        <Label>Subject Type</Label>
                        <Select
                          value={subject.type}
                          onValueChange={(value) => handleSubjectChange(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject type" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjectTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Internal Marks */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Continuous Internal Assessment (CIA) Min Marks</Label>
                            <Input
                              type="number"
                              placeholder="Min marks"
                              value={subject.internal_minMarks}
                              onChange={(e) =>
                                handleSubjectChange(
                                  index,
                                  'internal_minMarks',
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Continuous Internal Assessment (CIA) Max Marks</Label>
                            <Input
                              type="number"
                              placeholder="Max marks"
                              value={subject.internal_maxMarks}
                              onChange={(e) =>
                                handleSubjectChange(
                                  index,
                                  'internal_maxMarks',
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        </div>

                        {/* External Marks */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>End Semester Examination (ESE) Min Marks</Label>
                            <Input
                              type="number"
                              placeholder="Min marks"
                              value={subject.external_minMarks}
                              onChange={(e) =>
                                handleSubjectChange(
                                  index,
                                  'external_minMarks',
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Semester Examination (ESE) Max Marks</Label>
                            <Input
                              type="number"
                              placeholder="Max marks"
                              value={subject.external_maxMarks}
                              onChange={(e) =>
                                handleSubjectChange(
                                  index,
                                  'external_maxMarks',
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSubject}
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
                </Button>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Session"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <Button
              type="button"
              onClick={() => window.location.href = '/enter-class'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
            >
              Enter Class Details <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
