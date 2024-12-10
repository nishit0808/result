'use client'

import * as React from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export function CourseSubmissionComponent() {
  const [data, setData] = React.useState({
    name: "",
    semester: ""
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    console.log("Starting request with:", data)

    try {
      const response = await axios.post('/api/course', {
        name: data.name,
        semester: data.semester.split(",").map(s => s.trim()),
      })
      console.log("Response:", response.data)
      toast({
        title: "Success",
        description: "Course submitted successfully!",
      })
      // Reset form after successful submission
      setData({ name: "", semester: "" })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to submit course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-red-100 via-red-300 to-red-500 dark:from-gray-900 dark:via-red-900 dark:to-red-800 p-4">
      <div className="container mx-auto">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Course Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-name">Course Name</Label>
                <Input
                  id="course-name"
                  name="name"
                  placeholder="e.g., Introduction to Computer Science"
                  value={data.name}
                  onChange={handleChange}
                  className="w-full"
                  required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-semester">Semester</Label>
                <Input
                  id="course-semester"
                  name="semester"
                  placeholder="e.g., Spring 2024, Fall 2024"
                  value={data.semester}
                  onChange={handleChange}
                  className="w-full"
                  required />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Course'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>)
  );
}