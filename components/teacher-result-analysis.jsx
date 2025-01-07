'use client';
import * as React from 'react'
import axios from 'axios'
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Users, TrendingUp, PieChart as PieChartIcon, GraduationCap } from "lucide-react"
import { Toaster, toast } from 'sonner'
import { Progress } from "@/components/ui/progress"

const departments = [
  'Computer Science',
  'Science',
  'Education',
  'Commerce',
  'Management',
  'Art'
]

export function TeacherResultAnalysisComponent() {
  const [selectedDepartment, setSelectedDepartment] = React.useState("")
  const [selectedTeacher, setSelectedTeacher] = React.useState("")
  const [selectedSubject, setSelectedSubject] = React.useState("")
  const [teachers, setTeachers] = React.useState([])
  const [teacherSubjects, setTeacherSubjects] = React.useState([])
  const [courseNames, setCourseNames] = React.useState({})
  const [subjectData, setSubjectData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [studentDistribution, setStudentDistribution] = React.useState([
    { name: 'Pass', value: 0, color: '#4299E1' },
    { name: 'Fail', value: 0, color: '#90CDF4' },
  ])

  // Fetch teachers when department changes
  React.useEffect(() => {
    const fetchTeachers = async () => {
      if (!selectedDepartment) return
      
      setLoading(true)
      try {
        const response = await axios.get('/api/teacher', {
          params: { department: selectedDepartment }
        })
        setTeachers(response.data)
      } catch (error) {
        toast.error('Failed to fetch teachers', {
          description: error.response?.data?.message || error.message
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [selectedDepartment])

  // Update teacher subjects when teacher changes
  React.useEffect(() => {
    if (selectedTeacher) {
      const teacher = teachers.find(t => t.name === selectedTeacher)
      if (teacher) {
        setTeacherSubjects(teacher.subjects || [])
      }
    } else {
      setTeacherSubjects([])
    }
  }, [selectedTeacher, teachers])

  // Fetch course names when teacher subjects change
  React.useEffect(() => {
    const fetchCourseNames = async () => {
      const uniqueCourseIds = [...new Set(teacherSubjects.map(subject => subject.course))]
      const newCourseNames = { ...courseNames }
      
      for (const courseId of uniqueCourseIds) {
        if (!newCourseNames[courseId]) {
          try {
            const response = await axios.get(`/api/course/${courseId}`)
            newCourseNames[courseId] = response.data.courseDetails.name
          } catch (error) {
            console.error(`Failed to fetch course name for ID ${courseId}:`, error)
            newCourseNames[courseId] = 'Unknown Course'
          }
        }
      }
      
      setCourseNames(newCourseNames)
    }

    if (teacherSubjects.length > 0) {
      fetchCourseNames()
    }
  }, [teacherSubjects])

  // Fetch subject data when a subject is selected
  React.useEffect(() => {
    const fetchSubjectData = async () => {
      if (selectedSubject === 'all') {
        // Fetch data for all subjects
        try {
          const allSubjectsData = await Promise.all(
            teacherSubjects.map(async (subject) => {
              const response = await axios.get('/api/marks/subject', {
                params: {
                  course: subject.course,
                  semester: subject.semester,
                  session: subject.session,
                  subjectName: subject.subject.split('(')[0].trim()
                }
              });
              return response.data;
            })
          );

          // Combine statistics
          const combinedData = {
            students: allSubjectsData.flatMap(data => data.students),
            statistics: {
              passedStudents: allSubjectsData.reduce((sum, data) => sum + data.statistics.passedStudents, 0),
              failedStudents: allSubjectsData.reduce((sum, data) => sum + data.statistics.failedStudents, 0),
              classAverage: allSubjectsData.reduce((sum, data) => sum + data.statistics.classAverage, 0) / allSubjectsData.length,
              passPercentage: allSubjectsData.reduce((sum, data) => sum + data.statistics.passPercentage, 0) / allSubjectsData.length
            }
          };

          setSubjectData(combinedData);
          
          // Update student distribution for all subjects
          setStudentDistribution([
            { name: 'Pass', value: combinedData.statistics.passedStudents, color: '#4299E1' },
            { name: 'Fail', value: combinedData.statistics.failedStudents, color: '#90CDF4' },
          ]);
        } catch (error) {
          console.error('Error fetching all subjects data:', error);
          toast.error('Failed to fetch combined subjects details');
        }
      } else if (selectedSubject) {
        const subject = teacherSubjects.find(s => s.subject === selectedSubject);
        if (subject) {
          try {
            const response = await axios.get('/api/marks/subject', {
              params: {
                course: subject.course,
                semester: subject.semester,
                session: subject.session,
                subjectName: subject.subject.split('(')[0].trim()
              }
            });
            setSubjectData(response.data);
            
            // Update student distribution
            if (response.data.statistics) {
              setStudentDistribution([
                { name: 'Pass', value: response.data.statistics.passedStudents, color: '#4299E1' },
                { name: 'Fail', value: response.data.statistics.failedStudents, color: '#90CDF4' },
              ]);
            }
          } catch (error) {
            console.error('Error fetching subject data:', error);
            toast.error('Failed to fetch subject details');
          }
        }
      }
    };

    fetchSubjectData();
  }, [selectedSubject, teacherSubjects])

  // Reset selections when changing department or teacher
  React.useEffect(() => {
    setSelectedTeacher("")
    setSelectedSubject("")
  }, [selectedDepartment])

  React.useEffect(() => {
    setSelectedSubject("")
  }, [selectedTeacher])

  const handleSubjectClick = async (subject) => {
    setSelectedSubject(subject.subject)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <Toaster position="top-center" expand={true} richColors />
      <div className="container mx-auto p-4 space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              Teacher Result Analysis
            </h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedTeacher} 
                onValueChange={setSelectedTeacher}
                disabled={!selectedDepartment || loading}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={loading ? "Loading teachers..." : "Select teacher"} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.name} value={teacher.name}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
                disabled={!selectedTeacher || teacherSubjects.length === 0}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {teacherSubjects.map((subject, index) => {
                    const subjectName = subject.subject.split('(')[0].trim()
                    return (
                      <SelectItem 
                        key={index} 
                        value={subject.subject}
                      >
                        {subjectName} ({subject.course} - {subject.semester})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedTeacher && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Total Students</CardTitle>
                  <Users className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {subjectData?.students?.length || 0}
                  </div>
                  <p className="text-sm text-blue-200">Current subject</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Pass Rate</CardTitle>
                  <GraduationCap className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {subjectData?.statistics?.passPercentage?.toFixed(1) || 0}%
                  </div>
                  <p className="text-sm text-blue-200">Current subject pass percentage</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Subjects Taught</CardTitle>
                  <BookOpen className="h-6 w-6 text-blue-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teacherSubjects.length}</div>
                  <p className="text-sm text-blue-200">Number of subjects</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <PieChartIcon className="mr-2 h-5 w-5" />
                    Pass/Fail Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {studentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Class Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subjectData && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Class Average</span>
                          <span className="text-sm font-medium">
                            {subjectData.statistics?.classAverage?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <Progress value={subjectData.statistics?.classAverage || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Pass Rate</span>
                          <span className="text-sm font-medium">
                            {subjectData.statistics?.passPercentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <Progress value={subjectData.statistics?.passPercentage || 0} className="h-2" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Detailed Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherSubjects.map((subject, index) => {
                      const subjectName = subject.subject.split('(')[0].trim()
                      const isSelected = selectedSubject === subject.subject || selectedSubject === 'all'
                      return (
                        <TableRow 
                          key={index}
                          className={isSelected ? 'bg-blue-50 dark:bg-blue-900/50' : ''}
                        >
                          <TableCell>{courseNames[subject.course] || 'Loading...'}</TableCell>
                          <TableCell>{subject.semester}</TableCell>
                          <TableCell>{subjectName}</TableCell>
                          <TableCell>{subject.session}</TableCell>
                          <TableCell>
                            <Badge variant={isSelected ? "default" : "secondary"}>
                              {isSelected && subjectData ? subjectData.students?.length : 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isSelected && subjectData && (
                              <Progress 
                                value={subjectData.statistics?.passPercentage || 0} 
                                className="h-2 w-24"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {selectedSubject && subjectData && (
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Student Performance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Internal (CIA)</TableHead>
                        <TableHead>External (ESE)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectData.students.map((student, index) => {
                        const internalPassed = student.marks.internal_obtainedMarks >= student.marks.internal_minMarks;
                        const externalPassed = student.marks.external_obtainedMarks >= student.marks.external_minMarks;
                        const status = internalPassed && externalPassed ? 'Pass' : 'Fail';

                        return (
                          <TableRow key={index}>
                            <TableCell>{student.student}</TableCell>
                            <TableCell>
                              <span className={!internalPassed ? 'text-red-500 font-medium' : ''}>
                                {student.marks.internal_obtainedMarks}
                              </span>
                              /{student.marks.internal_maxMarks}
                              <span className="text-xs text-gray-500 ml-1">
                                (min: {student.marks.internal_minMarks})
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={!externalPassed ? 'text-red-500 font-medium' : ''}>
                                {student.marks.external_obtainedMarks}
                              </span>
                              /{student.marks.external_maxMarks}
                              <span className="text-xs text-gray-500 ml-1">
                                (min: {student.marks.external_minMarks})
                              </span>
                            </TableCell>
                            <TableCell>
                              {student.marks.total}/
                              {student.marks.internal_maxMarks + student.marks.external_maxMarks}
                              <span className="text-xs text-gray-500 ml-1">
                                ({((student.marks.total / (student.marks.internal_maxMarks + student.marks.external_maxMarks)) * 100).toFixed(1)}%)
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={status === 'Pass' ? 'success' : 'destructive'}
                                className={status === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                              >
                                {status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}