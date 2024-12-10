'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, User, Mail, BookOpen } from 'lucide-react'

// This would typically come from your API or database
const subjectData = {
  'BCA': {
    '1st Year': ['Mathematics', 'Computer Fundamentals', 'Digital Logic'],
    '2nd Year': ['Data Structures', 'Database Management', 'Web Technologies'],
    '3rd Year': ['Software Engineering', 'Computer Networks', 'Project Work']
  },
  'MCA': {
    '1st Year': ['Advanced Programming', 'Computer Organization', 'Discrete Mathematics'],
    '2nd Year': ['Machine Learning', 'Cloud Computing', 'Thesis']
  },
  'B.Tech': {
    '1st Year': ['Engineering Mathematics', 'Physics', 'Chemistry'],
    '2nd Year': ['Data Structures', 'Digital Electronics', 'Computer Architecture'],
    '3rd Year': ['Operating Systems', 'Database Systems', 'Computer Networks'],
    '4th Year': ['Artificial Intelligence', 'Information Security', 'Project']
  }
}

export function ResultEntryForm() {
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('')
  const [subjects, setSubjects] = useState([])
  const [years, setYears] = useState([])

  useEffect(() => {
    if (course && year) {
      const newSubjects = subjectData[course][year].map(subjectName => ({
        name: subjectName,
        totalMarks: '',
        internalMarks: '',
        obtainedMarks: ''
      }))
      setSubjects(newSubjects)
    } else {
      setSubjects([])
    }
  }, [course, year])

  useEffect(() => {
    if (course) {
      setYears(Object.keys(subjectData[course]))
      setYear('')
    } else {
      setYears([])
      setYear('')
    }
  }, [course])

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects]
    newSubjects[index] = { ...newSubjects[index], [field]: value }
    setSubjects(newSubjects)
  }

  return (
    (<div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-primary text-primary-foreground p-6">
        <h2 className="text-2xl font-bold mb-6">Academic Portal</h2>
        <nav>
          <ul className="space-y-2">
            <li className="py-2 px-4 bg-primary-foreground text-primary rounded">Result Entry</li>
            <li className="py-2 px-4">Dashboard</li>
            <li className="py-2 px-4">Students</li>
            <li className="py-2 px-4">Courses</li>
            <li className="py-2 px-4">Reports</li>
          </ul>
        </nav>
      </div>
      <div className="flex-1 p-8">
        <Card
          className="w-full bg-card text-card-foreground shadow-md rounded-lg overflow-hidden">
          <CardHeader className="bg-card border-b p-6">
            <CardTitle className="text-2xl font-bold flex items-center">
              <GraduationCap className="mr-2" />
              Academic Result Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="course" className="text-sm font-medium">Course</Label>
                  <Select onValueChange={(value) => setCourse(value)}>
                    <SelectTrigger id="course" className="w-full bg-background border rounded-md">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(subjectData).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-sm font-medium">Year/Semester</Label>
                  <Select onValueChange={(value) => setYear(value)} value={year}>
                    <SelectTrigger id="year" className="w-full bg-background border rounded-md">
                      <SelectValue placeholder="Select year/semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Student Name</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="Enter student's full name"
                      className="pl-10 w-full bg-background border rounded-md" />
                    <User
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-sm font-medium">Student ID</Label>
                  <div className="relative">
                    <Input
                      id="studentId"
                      placeholder="Enter student's ID"
                      className="pl-10 w-full bg-background border rounded-md" />
                    <BookOpen
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter student's email"
                    className="pl-10 w-full bg-background border rounded-md" />
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    size={18} />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Subjects</Label>
                <AnimatePresence>
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={subject.name}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 bg-card border border-border rounded-md shadow-sm">
                      <div className="font-semibold text-primary mb-2">{subject.name}</div>
                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          placeholder="Total Marks"
                          value={subject.totalMarks}
                          onChange={(e) => handleSubjectChange(index, 'totalMarks', e.target.value)}
                          className="bg-muted border rounded-md" />
                        <Input
                          placeholder="Internal Marks"
                          value={subject.internalMarks}
                          onChange={(e) => handleSubjectChange(index, 'internalMarks', e.target.value)}
                          className="bg-muted border rounded-md" />
                        <Input
                          placeholder="Obtained Marks"
                          value={subject.obtainedMarks}
                          onChange={(e) => handleSubjectChange(index, 'obtainedMarks', e.target.value)}
                          className="bg-muted border rounded-md" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-md">
                Submit Result
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>)
  );
}