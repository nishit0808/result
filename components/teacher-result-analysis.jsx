'use client';
import * as React from 'react'
import axios from 'axios'
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Users, TrendingUp, PieChart as PieChartIcon, GraduationCap, BarChart3 } from "lucide-react"
import { Toaster, toast } from 'sonner'
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

const departments = [
  'Computer Science',
  'Science',
  'Education',
  'Commerce',
  'Management',
  'Art'
]

const COLORS = {
  pass: '#22c55e',     // Green
  fail: '#ef4444',     // Red
  absent: '#a855f7'    // Purple
};

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
    { name: 'Pass', value: 0, color: COLORS.pass },
    { name: 'Fail', value: 0, color: COLORS.fail },
  ])
  const [totalStudents, setTotalStudents] = React.useState(0)
  const [classPerformance, setClassPerformance] = React.useState({
    classAverage: 0,
    passRate: 0
  })

  // Function to calculate statistics for a subject's data
  const calculateSubjectStats = (data) => {
    if (!data || !Array.isArray(data)) return {
      totalStudents: 0,
      passCount: 0,
      absentCount: 0,
      failCount: 0,
      passPercentage: 0,
      classAverage: 0
    };

    const totalStudents = data.length;
    const passCount = data.filter(student => student.result === 'PASS').length;
    const absentCount = data.filter(student => student.result === 'ABSENT').length;
    const failCount = data.filter(student => student.result === 'FAIL').length;
    
    // Calculate pass percentage excluding absent students
    const presentStudents = totalStudents - absentCount;
    const passPercentage = presentStudents > 0 ? (passCount / presentStudents) * 100 : 0;

    // Calculate class average
    const totalMarks = data.reduce((sum, student) => {
      const marks = student.totalMarks === 'AB' ? 0 : Number(student.totalMarks);
      return sum + marks;
    }, 0);
    const classAverage = presentStudents > 0 ? totalMarks / presentStudents : 0;

    return {
      totalStudents,
      passCount,
      absentCount,
      failCount,
      passPercentage,
      classAverage
    };
  };

  // Function to fetch data for a single subject
  const fetchSubjectData = async (subject) => {
    try {
      const response = await axios.get('/api/marks/subject', {
        params: {
          course: subject.course,
          semester: subject.semester,
          session: subject.session,
          subjectName: subject.name || subject.subject
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data for ${subject.name || subject.subject}:`, error);
      return null;
    }
  };

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
    const fetchData = async () => {
      if (!selectedSubject) return;

      setLoading(true);
      try {
        if (selectedSubject === 'All Subjects') {
          // Fetch data for all subjects
          const allData = await Promise.all(
            teacherSubjects.map(subject => fetchSubjectData(subject))
          );
          // Filter out null responses
          const validData = allData.filter(Boolean);
          setSubjectData(validData);
        } else {
          const subject = teacherSubjects.find(s => s.subject === selectedSubject);
          if (subject) {
            const data = await fetchSubjectData(subject);
            setSubjectData([data]);
          }
        }
      } catch (error) {
        console.error('Error fetching subject data:', error);
        toast.error('Failed to fetch subject data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSubject, teacherSubjects])

  // Update student distribution and performance metrics when subject data changes
  React.useEffect(() => {
    if (subjectData) {
      let stats;
      if (selectedSubject === 'All Subjects') {
        // Combine data from all subjects
        const allStudents = subjectData.flatMap(subject => subject.data || []);
        stats = calculateSubjectStats(allStudents);
      } else {
        stats = calculateSubjectStats(subjectData[0]?.data || []);
      }

      // Update distribution for pie chart including absent
      setStudentDistribution([
        { 
          name: `Pass\n${stats.passCount} (${stats.passPercentage.toFixed(0)}%)`, 
          value: stats.passCount, 
          color: COLORS.pass,
          actualValue: stats.passCount
        },
        { 
          name: `Absent\n${stats.absentCount} (${((stats.absentCount / stats.totalStudents) * 100).toFixed(0)}%)`, 
          value: stats.absentCount, 
          color: COLORS.absent,
          actualValue: stats.absentCount
        },
        { 
          name: `Fail\n${stats.failCount} (${((stats.failCount / (stats.totalStudents - stats.absentCount)) * 100).toFixed(0)}%)`, 
          value: stats.failCount, 
          color: COLORS.fail,
          actualValue: stats.failCount
        }
      ]);

      setTotalStudents(stats.totalStudents);
      
      // Update class performance metrics
      setClassPerformance({
        classAverage: stats.classAverage.toFixed(1),
        passRate: stats.passPercentage.toFixed(1)
      });
    }
  }, [subjectData, selectedSubject]);

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

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(18);
    doc.text('Pass/Fail Distribution Report', pageWidth / 2, 20, { align: 'center' });
    
    // Subject Info
    doc.setFontSize(12);
    if (selectedSubject === 'All Subjects') {
      doc.text(`Teacher: ${selectedTeacher}`, 20, 35);
      doc.text(`Department: ${selectedDepartment}`, 20, 45);
      doc.text('Subjects: All Subjects', 20, 55);
    } else {
      const subject = teacherSubjects.find(s => s.subject === selectedSubject);
      doc.text(`Teacher: ${selectedTeacher}`, 20, 35);
      doc.text(`Department: ${selectedDepartment}`, 20, 45);
      doc.text(`Subject: ${selectedSubject}`, 20, 55);
      doc.text(`Class: ${courseNames[subject?.course]} ${subject?.semester}`, 20, 65);
      doc.text(`Session: ${subject?.session}`, 20, 75);
    }

    // Statistics
    doc.setFontSize(14);
    doc.text('Statistics:', 20, 90);
    doc.setFontSize(12);
    const stats = selectedSubject === 'All Subjects' 
      ? calculateSubjectStats(subjectData.flatMap(subject => subject.data || []))
      : calculateSubjectStats(subjectData[0]?.data || []);
    
    doc.text(`Class Average: ${stats.classAverage.toFixed(2)}`, 30, 100);
    doc.text(`Pass Percentage: ${stats.passPercentage.toFixed(2)}%`, 30, 110);
    doc.text(`Total Students: ${stats.totalStudents}`, 30, 120);
    doc.text(`Passed: ${stats.passCount}`, 30, 130);
    doc.text(`Failed: ${stats.failCount}`, 30, 140);
    doc.text(`Absent: ${stats.absentCount}`, 30, 150);

    // Create pie chart canvas
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pie chart
    const centerX = 150;  // Moved to left side
    const centerY = canvas.height / 2;
    const radius = 120;
    
    let currentAngle = 0;
    const total = studentDistribution.reduce((acc, item) => acc + item.value, 0);
    
    // Draw pie slices
    studentDistribution.forEach(item => {
      const sliceAngle = (2 * Math.PI * item.value) / total;
      
      ctx.beginPath();
      ctx.fillStyle = item.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      currentAngle += sliceAngle;
    });

    // Add legend
    const legendX = 300;
    const legendY = centerY - (studentDistribution.length * 20) / 2;
    
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    
    studentDistribution.forEach((item, index) => {
      const y = legendY + (index * 25);
      
      // Draw color box
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, y - 8, 15, 15);
      
      // Draw text
      ctx.fillStyle = '#000000';
      ctx.fillText(
        `${item.name.split('\n')[0]}: ${((item.value / total) * 100).toFixed(2)}%`,
        legendX + 25,
        y + 4
      );
    });

    // Add pie chart to PDF
    doc.text('Pass/Fail Distribution:', 20, 170);
    doc.addImage(canvas.toDataURL(), 'PNG', 20, 180, 170, 100);

    // Save the PDF
    const fileName = selectedSubject === 'All Subjects' 
      ? `${selectedTeacher}_all_subjects_report.pdf`
      : `${selectedTeacher}_${selectedSubject}_report.pdf`;
    
    doc.save(fileName);
  };

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
                  <SelectItem value="All Subjects">All Subjects</SelectItem>
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
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pass/Fail Distribution Chart */}
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex flex-col space-y-1.5">
                    <CardTitle className="text-lg font-medium">Pass/Fail Distribution</CardTitle>
                    <CardDescription>Distribution of student results</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={generatePDF}
                    >
                      <FileDown className="h-4 w-4" />
                      Download Report
                    </Button>
                    <PieChartIcon className="h-6 w-6 text-gray-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studentDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {studentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend 
                          layout="vertical" 
                          align="right"
                          verticalAlign="middle"
                          wrapperStyle={{
                            paddingLeft: "20px",
                            fontSize: "12px",
                            lineHeight: "1.5em"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Class Average Card */}
              <div className="grid gap-6">
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex flex-col space-y-1.5">
                      <CardTitle className="text-lg font-medium">Class Average</CardTitle>
                      <CardDescription>Average marks across all students</CardDescription>
                    </div>
                    <BarChart3 className="h-6 w-6 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-4xl font-bold">{classPerformance.classAverage}%</p>
                          <p className="text-sm text-muted-foreground">
                            Overall class performance
                          </p>
                        </div>
                        <div className={cn(
                          "rounded-full p-3",
                          Number(classPerformance.classAverage) >= 75 ? "bg-green-100 text-green-700" :
                          Number(classPerformance.classAverage) >= 60 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          <BarChart3 className="h-8 w-8" />
                        </div>
                      </div>
                      <Progress value={Number(classPerformance.classAverage)} className="h-2" style={{ '--progress-background': 'var(--green-500)' }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Pass/Absent/Fail Stats Card */}
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex flex-col space-y-1.5">
                      <CardTitle className="text-lg font-medium">Pass/Absent/Fail Stats</CardTitle>
                      <CardDescription>Detailed performance breakdown</CardDescription>
                    </div>
                    <Users className="h-6 w-6 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentDistribution.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium" style={{ color: stat.color }}>
                              {stat.name.split('\n')[0]}
                            </p>
                            <p className="text-2xl font-bold" style={{ color: stat.color }}>
                              {stat.actualValue}
                            </p>
                          </div>
                          <Progress 
                            value={(stat.value / totalStudents) * 100} 
                            className="h-2 w-[120px]"
                            style={{
                              ['--progress-background']: stat.color
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                      <TableHead className="text-center">Total Students</TableHead>
                      <TableHead className="text-center">Pass/Absent/Fail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherSubjects.map((subject, index) => {
                      const subjectName = subject.subject.split('(')[0].trim();
                      let stats = { totalStudents: 0, passCount: 0, absentCount: 0, failCount: 0 };
                      
                      // Find data for this subject
                      const subjectDataItem = subjectData && Array.isArray(subjectData) && 
                        subjectData.find(data => 
                          data?.subjectDetails?.name === subject.name || 
                          data?.subjectDetails?.name === subject.subject
                        );
                      
                      if (subjectDataItem?.data) {
                        stats = calculateSubjectStats(subjectDataItem.data);
                      }
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{courseNames[subject.course] || 'Loading...'}</TableCell>
                          <TableCell>{subject.semester}</TableCell>
                          <TableCell>{subjectName}</TableCell>
                          <TableCell>{subject.session}</TableCell>
                          <TableCell className="text-center font-medium">
                            {stats.totalStudents}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-green-600 font-medium">{stats.passCount}</span>
                              <span className="text-gray-500">/</span>
                              <span className="text-purple-600 font-medium">{stats.absentCount}</span>
                              <span className="text-gray-500">/</span>
                              <span className="text-red-600 font-medium">{stats.failCount}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
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
                        <TableHead>Roll No</TableHead>
                        <TableHead>Internal (CIA)</TableHead>
                        <TableHead>External (ESE)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSubject === 'All Subjects' ? (
                        // Show students from all subjects
                        subjectData?.flatMap((subject, subjectIndex) => 
                          subject?.data?.map((student, studentIndex) => {
                            const internalMarks = student.internalMarks === 'A' ? 0 : Number(student.internalMarks);
                            const externalMarks = student.externalMarks === 'A' ? 0 : Number(student.externalMarks);
                            const totalMarks = student.totalMarks === 'AB' ? 'Absent' : student.totalMarks;

                            return (
                              <TableRow key={`${subjectIndex}-${studentIndex}`}>
                                <TableCell>{student.studentName}</TableCell>
                                <TableCell className="font-medium">{student.rollNo}</TableCell>
                                <TableCell>{subject.subjectDetails?.name || 'N/A'}</TableCell>
                                <TableCell className="text-center">
                                  {student.internalMarks === 'A' ? 'AB' : student.internalMarks}
                                </TableCell>
                                <TableCell className="text-center">
                                  {student.externalMarks === 'A' ? 'AB' : student.externalMarks}
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {totalMarks}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                      student.result === 'PASS' && "bg-green-100 text-green-700",
                                      student.result === 'FAIL' && "bg-red-100 text-red-700",
                                      student.result === 'ABSENT' && "bg-purple-100 text-purple-700"
                                    )}
                                  >
                                    {student.result}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )
                      ) : (
                        // Show students from selected subject
                        subjectData[0]?.data?.map((student, index) => {
                          const internalMarks = student.internalMarks === 'A' ? 0 : Number(student.internalMarks);
                          const externalMarks = student.externalMarks === 'A' ? 0 : Number(student.externalMarks);
                          const totalMarks = student.totalMarks === 'AB' ? 'Absent' : student.totalMarks;

                          return (
                            <TableRow key={index}>
                              <TableCell>{student.studentName}</TableCell>
                              <TableCell className="font-medium">{student.rollNo}</TableCell>
                              <TableCell>{subjectData[0].subjectDetails?.name || 'N/A'}</TableCell>
                              <TableCell className="text-center">
                                {student.internalMarks === 'A' ? 'AB' : student.internalMarks}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.externalMarks === 'A' ? 'AB' : student.externalMarks}
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {totalMarks}
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                    student.result === 'PASS' && "bg-green-100 text-green-700",
                                    student.result === 'FAIL' && "bg-red-100 text-red-700",
                                    student.result === 'ABSENT' && "bg-purple-100 text-purple-700"
                                  )}
                                >
                                  {student.result}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
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