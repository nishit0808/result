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

export default function SessionEntryForm() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [session, setSession] = useState('')
  const [subjects, setSubjects] = useState([
    {
      name: '',
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

    try {
      const formattedSubjects = subjects.map(subject => ({
        name: subject.name,
        internal_minMarks: Number(subject.internal_minMarks),
        internal_maxMarks: Number(subject.internal_maxMarks),
        external_minMarks: Number(subject.external_minMarks),
        external_maxMarks: Number(subject.external_maxMarks),
      }))

      const payload = {
        course: selectedCourse,
        semester: selectedSemester,
        session,
        ssubjects: formattedSubjects,
      }

      await axios.post('/api/sessions', payload)
      resetForm()
    } catch (error) {
      console.error('Error creating session:', error.response?.data || error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedCourse('')
    setSelectedSemester('')
    setSession('')
    setSubjects([
      {
        name: '',
        internal_minMarks: '',
        internal_maxMarks: '',
        external_minMarks: '',
        external_maxMarks: '',
      },
    ])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800 p-4">
      <div className="container mx-auto space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Session Entry Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 p-4 border border-gray-200 rounded-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                    >
                      <SelectTrigger className="w-full">
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

                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                      value={selectedSemester}
                      onValueChange={(e) => handlesemesterChange(e)}
                    >
                      <SelectTrigger className="w-full">
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

                  <div className="space-y-2">
                    <Label htmlFor="session">Session</Label>
                    <Input
                      type="text"
                      id="session"
                      placeholder="e.g., 2023-2024"
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {subjects.map((subject, index) => (
                <div
                  key={index}
                  className="space-y-2 p-4 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow space-y-2">
                      <Label htmlFor={`subject-name-${index}`}>
                        Subject Name
                      </Label>
                      <Input
                        id={`subject-name-${index}`}
                        placeholder="e.g., Mathematics"
                        value={subject.name}
                        onChange={(e) =>
                          handleSubjectChange(index, "name", e.target.value)
                        }
                        required
                      />
                    </div>
                    {subjects.length > 1 && (
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Internal Assessment</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input
                          type="number"
                          placeholder="Min Marks"
                          value={subject.internal_minMarks}
                          onChange={(e) =>
                            handleSubjectChange(
                              index,
                              "internal_minMarks",
                              e.target.value
                            )
                          }
                          required
                        />
                        <Input
                          type="number"
                          placeholder="Max Marks"
                          value={subject.internal_maxMarks}
                          onChange={(e) =>
                            handleSubjectChange(
                              index,
                              "internal_maxMarks",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>External Assessment</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input
                          type="number"
                          placeholder="Min Marks"
                          value={subject.external_minMarks}
                          onChange={(e) =>
                            handleSubjectChange(
                              index,
                              "external_minMarks",
                              e.target.value
                            )
                          }
                          required
                        />
                        <Input
                          type="number"
                          placeholder="Max Marks"
                          value={subject.external_maxMarks}
                          onChange={(e) =>
                            handleSubjectChange(
                              index,
                              "external_maxMarks",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addSubject}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
              </Button>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
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
              Enter the Students <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
