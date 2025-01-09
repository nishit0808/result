'use client'

import * as React from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

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
  const [selectedMetric, setSelectedMetric] = React.useState('total'); // 'cia', 'ese', or 'total'
  const chartRef = useRef(null);

  const exportToPDF = async () => {
    if (!chartRef.current || !marksData) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add header with logo (if available)
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Student Performance Report', pdf.internal.pageSize.width / 2, 20, { align: 'center' });

      // Add student details
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const detailsY = 40;
      pdf.text(`Name: ${marksData.name}`, 20, detailsY);
      pdf.text(`Roll No: ${marksData.rollNo}`, 20, detailsY + 8);
      pdf.text(`Class: ${selectedCourseName} ${selectedSemester}`, 20, detailsY + 16);
      pdf.text(`Session: ${selectedSession}`, 20, detailsY + 24);

      // Add statistics section
      pdf.setFontSize(14);
      pdf.text('Statistics:', 20, detailsY + 40);
      
      pdf.setFontSize(12);
      const totalMarks = marksData.subjects.reduce((acc, subject) => {
        const total = calculateTotal(subject.internal_obtainedMarks, subject.external_obtainedMarks);
        return total === 'AB' ? acc : acc + total;
      }, 0);
      
      const maxMarks = marksData.subjects.reduce((acc, subject) => 
        acc + Number(subject.internal_maxMarks) + Number(subject.external_maxMarks), 0);
      
      const percentage = ((totalMarks / maxMarks) * 100).toFixed(2);
      const failedSubjects = marksData.subjects.filter(subject => 
        calculateTotal(subject.internal_obtainedMarks, subject.external_obtainedMarks) < 
        (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks)) * 0.4
      ).length;

      pdf.text(`Total Marks: ${totalMarks}/${maxMarks}`, 25, detailsY + 48);
      pdf.text(`Percentage: ${percentage}%`, 25, detailsY + 56);
      pdf.text(`Result: ${marksData.result || 'N/A'}`, 25, detailsY + 64);
      pdf.text(`Failed Subjects: ${failedSubjects}`, 25, detailsY + 72);

      // Add performance chart
      pdf.setFontSize(14);
      pdf.text('Performance Chart:', 20, detailsY + 90);
      
      // Calculate dimensions to fit the chart properly
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, detailsY + 95, imgWidth, imgHeight);

      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, pdf.internal.pageSize.height - 10);
      pdf.text('Generated by Student Result Analysis System', pdf.internal.pageSize.width - 20, pdf.internal.pageSize.height - 10, { align: 'right' });

      // Save the PDF
      pdf.save(`${marksData.rollNo}-performance-report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

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

  // Fetch students when course, semester and session are selected
  React.useEffect(() => {
    const fetchStudents = async () => {
      if (selectedCourse && selectedSemester && selectedSession) {
        try {
          const response = await axios.get(`/api/class?course=${selectedCourse}&semester=${selectedSemester}&session=${selectedSession}`);
          if (response.data && response.data.length > 0) {
            const classData = response.data[0];
            // Don't transform the data, keep original format
            setStudents(classData.students);
          } else {
            setStudents([]);
          }
        } catch (error) {
          console.error('Error fetching students:', error);
          setStudents([]);
        }
      }
    };

    fetchStudents();
  }, [selectedCourse, selectedSemester, selectedSession]);

  // Fetch student marks when student is selected
  React.useEffect(() => {
    const fetchMarks = async () => {
      if (!selectedStudent) {
        setMarksData(null);
        return;
      }

      try {
        // Find the selected student from the students array
        const studentData = students.find(s => s.rollNo === selectedStudent);
        
        if (!studentData) {
          console.error('Selected student not found');
          return;
        }

        const response = await axios.get('/api/marks', {
          params: {
            student: studentData.rollNo,
            course: selectedCourse,
            semester: selectedSemester,
            session: selectedSession
          }
        });

        if (response.data) {
          setMarksData({
            ...response.data,
            name: studentData.name,
            rollNo: studentData.rollNo
          });
        }
      } catch (error) {
        console.error('Error fetching marks:', error);
        setMarksData(null);
      }
    };

    fetchMarks();
  }, [selectedStudent, selectedCourse, selectedSemester, selectedSession, students]);

  // Calculate total marks
  const calculateTotal = (internal = 0, external = 0) => {
    if (internal === 'A' || external === 'A') return 'AB';
    return Number(internal) + Number(external);
  };

  // Calculate total marks for all subjects
  const calculateTotalMarks = () => {
    if (!marksData?.subjects) return 0;
    return marksData.subjects.reduce((total, subject) => {
      const subjectTotal = calculateTotal(subject.internal_obtainedMarks, subject.external_obtainedMarks);
      return subjectTotal === 'AB' ? total : total + subjectTotal;
    }, 0);
  };

  // Prepare chart data with formatted subject names
  const chartData = marksData?.subjects?.map(subject => {
    // Extract the subject code and name
    const match = subject.subjectName.match(/^(.*?)\s*\((BCA-\d+)\)$/);
    let displayName;
    
    if (match) {
      // Split the subject name into words
      const words = match[1].split(' ');
      const code = match[2];
      
      // Group words to create lines (max 2-3 words per line)
      const lines = [];
      let currentLine = [];
      let currentLength = 0;
      
      words.forEach(word => {
        if (currentLength + word.length > 20 || currentLine.length >= 3) {
          lines.push(currentLine.join(' '));
          currentLine = [word];
          currentLength = word.length;
        } else {
          currentLine.push(word);
          currentLength += word.length + (currentLine.length > 0 ? 1 : 0); // +1 for space
        }
      });
      
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }
      
      // Add the code as the last line
      lines.push(`(${code})`);
      
      // Join lines with newline character
      displayName = lines.join('\n');
    } else {
      // If no code found, just wrap the text
      const words = subject.subjectName.split(' ');
      const lines = [];
      let currentLine = [];
      let currentLength = 0;
      
      words.forEach(word => {
        if (currentLength + word.length > 20 || currentLine.length >= 3) {
          lines.push(currentLine.join(' '));
          currentLine = [word];
          currentLength = word.length;
        } else {
          currentLine.push(word);
          currentLength += word.length + (currentLine.length > 0 ? 1 : 0);
        }
      });
      
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }
      
      displayName = lines.join('\n');
    }

    return {
      subject: displayName,
      CIA: subject.internal_obtainedMarks === 'A' ? 0 : Number(subject.internal_obtainedMarks),
      ESE: subject.external_obtainedMarks === 'A' ? 0 : Number(subject.external_obtainedMarks),
      Total: calculateTotal(subject.internal_obtainedMarks, subject.external_obtainedMarks) === 'AB' 
        ? 0 
        : Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks),
      CIA_Max: Number(subject.internal_maxMarks),
      ESE_Max: Number(subject.external_maxMarks),
      Total_Max: Number(subject.internal_maxMarks) + Number(subject.external_maxMarks)
    };
  }) || [];

  // Get max value for y-axis based on selected metric
  const getYAxisMax = () => {
    switch(selectedMetric) {
      case 'cia':
        return Math.max(...chartData.map(item => item.CIA_Max));
      case 'ese':
        return Math.max(...chartData.map(item => item.ESE_Max));
      case 'total':
        return Math.max(...chartData.map(item => item.Total_Max));
      default:
        return 100;
    }
  };

  const renderChart = () => {
    const barColor = {
      cia: "#3b82f6",    // Blue
      ese: "#22c55e",    // Green
      total: "#8b5cf6"   // Purple
    };

    return (
      <div className="w-full h-[600px]" ref={chartRef}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 40, bottom: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="subject"
              angle={0}
              textAnchor="middle"
              height={120}
              interval={0}
              label={{ 
                value: 'Subjects->',
                fontSize: 18,
                position: 'bottom',
                offset: -30
              }}
              tick={{ 
                fontSize: 16,
                width: 120,
                wordWrap: 'break-word',
                fill: '#666'
              }}
            />
            <YAxis
              label={{ 
                value: 'Marks->',
                angle: -90,
                position: 'insideLeft',
                fontSize: 18,
                offset: -5
              }}tick={{ 
                fontSize: 16
              }}
              domain={[0, getYAxisMax()]}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Tooltip />
            <Legend />
            {selectedMetric === 'cia' && (
              <Bar
                dataKey="CIA"
                fill="#3b82f6"
                name="CIA Marks"
              >
                <LabelList dataKey="CIA" position="top" />
              </Bar>
            )}
            {selectedMetric === 'ese' && (
              <Bar
                dataKey="ESE"
                fill="#22c55e"
                name="ESE Marks"
              >
                <LabelList dataKey="ESE" position="top" />
              </Bar>
            )}
            {selectedMetric === 'total' && (
              <Bar
                dataKey="Total"
                fill="#8b5cf6"
                name="Total Marks"
              >
                <LabelList dataKey="Total" position="top" />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

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

  const calculateFailedSubjects = () => {
    if (!marksData?.subjects) return 0
    return marksData.subjects.filter(subject => {
      const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
      const maxTotal = Number(subject.internal_maxMarks) + Number(subject.external_maxMarks)
      return (total / maxTotal) * 100 < 40
    }).length
  }

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
                disabled={!students.length}>
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
              <div className="grid grid-cols-1 gap-6">
                {/* Student Info Card */}
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Student Details */}
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Student Details</h2>
                        <div className="space-y-2">
                          <p><span className="font-semibold">Name:</span> {marksData?.name}</p>
                          <p><span className="font-semibold">Roll No:</span> {marksData?.rollNo}</p>
                          <p><span className="font-semibold">Class:</span> {selectedCourseName} {selectedSemester}</p>
                          <p><span className="font-semibold">Session:</span> {selectedSession}</p>
                        </div>
                      </div>

                      {/* Right Column - Overall Performance */}
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
                        <div className="space-y-2">
                          <p><span className="font-semibold">Total Marks:</span> {calculateTotalMarks()}</p>
                          <p><span className="font-semibold">Percentage:</span> {calculatePercentage()}%</p>
                          <p><span className="font-semibold">Result:</span> {marksData?.result || 'N/A'}</p>
                          <p><span className="font-semibold">Failed Subjects:</span> {calculateFailedSubjects()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Marks Table */}
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle>Detailed Marks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">CIA (Internal)</TableHead>
                            <TableHead className="text-center">ESE (External)</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marksData.subjects.map((subject, index) => (
                            <TableRow key={index}>
                              <TableCell>{subject.subjectName}</TableCell>
                              <TableCell className="text-center">
                                {subject.internal_obtainedMarks}/{subject.internal_maxMarks}
                              </TableCell>
                              <TableCell className="text-center">
                                {subject.external_obtainedMarks}/{subject.external_maxMarks}
                              </TableCell>
                              <TableCell className="text-center">
                                {calculateTotal(subject.internal_obtainedMarks, subject.external_obtainedMarks)}/{Number(subject.internal_maxMarks) + Number(subject.external_maxMarks)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Chart Card */}
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle>Performance Chart</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedMetric === 'cia' ? 'default' : 'outline'}
                        onClick={() => setSelectedMetric('cia')}
                        className={selectedMetric === 'cia' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        CIA
                      </Button>
                      <Button
                        variant={selectedMetric === 'ese' ? 'default' : 'outline'}
                        onClick={() => setSelectedMetric('ese')}
                        className={selectedMetric === 'ese' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        ESE
                      </Button>
                      <Button
                        variant={selectedMetric === 'total' ? 'default' : 'outline'}
                        onClick={() => setSelectedMetric('total')}
                        className={selectedMetric === 'total' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      >
                        Total Marks
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderChart()}
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={exportToPDF}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        disabled={!marksData}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject-Specific Analysis Card */}
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle>Subject-Specific Strengths and Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {marksData?.subjects?.map((subject, index) => {
                        const totalObtained = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
                        const totalMax = Number(subject.internal_maxMarks) + Number(subject.external_maxMarks)
                        const percentage = (totalObtained / totalMax) * 100
                        
                        return (
                          <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{subject.subjectName}</h3>
                              <Badge className={
                                percentage >= 75 ? "bg-green-500" :
                                percentage >= 60 ? "bg-blue-500" :
                                percentage >= 40 ? "bg-yellow-500" :
                                "bg-red-500"
                              }>
                                {percentage.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>CIA: {subject.internal_obtainedMarks}/{subject.internal_maxMarks}</span>
                                <span>ESE: {subject.external_obtainedMarks}/{subject.external_maxMarks}</span>
                                <span>Total: {totalObtained}/{totalMax}</span>
                              </div>
                              <Progress 
                                value={percentage} 
                                className={
                                  percentage >= 75 ? "bg-green-200" :
                                  percentage >= 60 ? "bg-blue-200" :
                                  percentage >= 40 ? "bg-yellow-200" :
                                  "bg-red-200"
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}