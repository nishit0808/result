'use client'

import * as React from 'react'
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip, XAxis, YAxis } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Trophy,
  TrendingUp,
  PieChart as PieChartIcon,
  Download,
} from "lucide-react";
import axios from 'axios'
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const COLORS = {
  pass: '#22c55e',     // Green
  supply: '#f97316',   // Orange
  fail: '#ef4444',     // Red
  absent: '#a855f7',   // Purple
  withheld: '#eab308'  // Yellow
};

export function ClassAnalyticsDashboardComponent() {
  const [courses, setCourses] = React.useState([])
  const [sessions, setSessions] = React.useState([])
  const [selectedClass, setSelectedClass] = React.useState("")
  const [selectedSemester, setSelectedSemester] = React.useState("")
  const [selectedSession, setSelectedSession] = React.useState("")
  const [selectedCourseIndex, setSelectedCourseIndex] = React.useState("")
  const [studentResults, setStudentResults] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [analytics, setAnalytics] = React.useState({
    classAverage: 0,
    topScore: 0,
    passPercentage: 0,
    distribution: {
      pass: 0,
      supply: 0,
      fail: 0,
      absent: 0,
      withheld: 0
    },
    topPerformers: [],
    needsImprovement: [],
    subjectPerformance: []
  })

  const chartRef = React.useRef(null)

  const downloadChartsPDF = async () => {
    const element = chartRef.current;
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30;

    // Add title
    pdf.setFontSize(16);
    pdf.text('Performance Analysis Charts', pdfWidth / 2, 15, { align: 'center' });

    // Add metadata with combined class and semester
    pdf.setFontSize(12);
    pdf.text(`Class: ${selectedClass} ${selectedSemester}`, 20, 25);
    pdf.text(`Session: ${selectedSession}`, 20, 30);
    pdf.text(`Generated on: ${new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })}`, 20, 35);

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`performance-charts-${selectedClass}-${selectedSemester}.pdf`);
  };

  // Helper function to format percentage
  const formatPercentage = (value) => Number(value.toFixed(2))

  // Helper function to calculate result based on failed subjects
  const calculateStudentResult = (subjects) => {
    if (!subjects) return 'UNKNOWN';
    
    const failedSubjects = subjects.filter(subject => {
      const totalObtained = subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A' 
        ? 0 
        : Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks);
      const totalMin = Number(subject.internal_minMarks) + Number(subject.external_minMarks);
      return totalObtained < totalMin;
    });

    if (failedSubjects.length === 0) return 'PASS';
    if (failedSubjects.length <= 2) return 'SUPPLY';
    return 'FAIL';
  };

  // Fetch courses on mount
  React.useEffect(() => {
    axios
      .get(`/api/course`)
      .then((res) =>
        setCourses(res.data)
      )
      .catch((err) => console.log(err))
  }, [])

  // Update course index when class changes
  React.useEffect(() => {
    const selectedCourse = courses.findIndex((course) => course.name === selectedClass)
    setSelectedCourseIndex(selectedCourse)
    // Reset dependent fields
    setSelectedSemester("")
    setSelectedSession("")
  }, [selectedClass])

  // Fetch sessions when course and semester are selected
  React.useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedClass || !selectedSemester) {
        setSessions([])
        return
      }

      try {
        const selectedCourseData = courses.find(course => course.name === selectedClass)
        if (!selectedCourseData) return

        const response = await axios.get('/api/sessions')
        const filteredSessions = response.data
          .filter(session => session.course._id === selectedCourseData._id)
          .map(session => session.session)
        
        const uniqueSessions = [...new Set(filteredSessions)]
        setSessions(uniqueSessions)
      } catch (error) {
        console.error('Error fetching sessions:', error)
      }
    }
    fetchSessions()
  }, [selectedClass, selectedSemester, courses])

  // Fetch student results when all selections are made
  React.useEffect(() => {
    const fetchStudentResults = async () => {
      if (!selectedClass || !selectedSemester || !selectedSession) {
        setStudentResults([])
        return
      }

      setLoading(true)
      try {
        const selectedCourseData = courses.find(course => course.name === selectedClass)
        if (!selectedCourseData) return

        const classResponse = await axios.get('/api/class', {
          params: {
            course: selectedCourseData._id,
            semester: selectedSemester,
            session: selectedSession
          }
        })

        if (!classResponse.data[0]?.students) {
          throw new Error('No students found in class')
        }

        const studentsWithMarks = await Promise.all(
          classResponse.data[0].students.map(async (student) => {
            try {
              const marksResponse = await axios.get('/api/marks', {
                params: {
                  course: selectedCourseData._id,
                  semester: selectedSemester,
                  session: selectedSession,
                  student: student.rollNo || student.uid
                }
              })

              if (!marksResponse.data?.subjects) return null

              // Calculate result based on failed subjects
              const result = marksResponse.data.isWithheld 
                ? 'WITHHELD'
                : calculateStudentResult(marksResponse.data.subjects);

              return {
                name: student.name,
                rollNo: student.rollNo,
                uid: student.uid,
                course: selectedCourseData._id,
                semester: selectedSemester,
                session: selectedSession,
                subjects: marksResponse.data.subjects,
                result: result,
                failedSubjects: marksResponse.data.subjects.filter(subject => {
                  const totalObtained = subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A'
                    ? 0
                    : Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks);
                  const totalMin = Number(subject.internal_minMarks) + Number(subject.external_minMarks);
                  return totalObtained < totalMin;
                }).length
              };
            } catch (error) {
              console.error(`Error fetching marks for student ${student.name}:`, error)
              return null
            }
          })
        )

        const validResults = studentsWithMarks.filter(result => result !== null)
        setStudentResults(validResults)
      } catch (error) {
        console.error('Error fetching student results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentResults()
  }, [selectedClass, selectedSemester, selectedSession, courses])

  // Clear analytics when selections change
  React.useEffect(() => {
    setAnalytics({
      classAverage: 0,
      topScore: 0,
      passPercentage: 0,
      distribution: { pass: 0, supply: 0, fail: 0, absent: 0, withheld: 0 },
      topPerformers: [],
      needsImprovement: [],
      subjectPerformance: []
    })
  }, [selectedClass, selectedSemester, selectedSession])

  // Calculate analytics from student results
  React.useEffect(() => {
    if (!studentResults.length) {
      setAnalytics({
        classAverage: 0,
        topScore: 0,
        passPercentage: 0,
        distribution: { pass: 0, supply: 0, fail: 0, absent: 0, withheld: 0 },
        topPerformers: [],
        needsImprovement: [],
        subjectPerformance: {}
      });
      return;
    }

    const currentStudents = studentResults.filter(Boolean);

    // Calculate top score
    const topScore = Math.max(...currentStudents.map(student => {
      const totalMarks = student.subjects.reduce((acc, subject) => {
        if (subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A') {
          return acc;
        }
        return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks));
      }, 0);

      const totalMaxMarks = student.subjects.reduce((acc, subject) => {
        return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks));
      }, 0);

      return (totalMarks / totalMaxMarks) * 100;
    }));

    // Calculate pass percentage
    const totalStudents = currentStudents.length;
    const passedStudents = currentStudents.filter(student => student.result === 'PASS').length;
    const passPercentage = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;

    // Calculate distribution
    const distribution = {
      pass: currentStudents.filter(student => student.result === 'PASS').length,
      supply: currentStudents.filter(student => student.result === 'SUPPLY').length,
      fail: currentStudents.filter(student => student.result === 'FAIL').length,
      absent: currentStudents.filter(student => student.result === 'ABSENT').length,
      withheld: currentStudents.filter(student => student.result === 'WITHHELD').length
    };

    // Get top 3 performers
    const topPerformers = currentStudents
      .map(student => {
        const totalMarks = student.subjects.reduce((acc, subject) => {
          if (subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A') {
            return acc;
          }
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks));
        }, 0);

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks));
        }, 0);

        return {
          name: student.name,
          rollNo: student.rollNo,
          totalMarks,
          totalMaxMarks,
          percentage: (totalMarks / totalMaxMarks) * 100
        };
      })
      .filter(student => student.percentage > 0 && !isNaN(student.percentage))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
      .map(student => ({
        name: student.name,
        rollNo: student.rollNo,
        percentage: formatPercentage(student.percentage)
      }));

    // Get students needing improvement (below 70% but passed)
    const needsImprovement = currentStudents
      .map(student => {
        const totalMarks = student.subjects.reduce((acc, subject) => {
          if (subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A') {
            return acc;
          }
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks));
        }, 0);

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks));
        }, 0);

        const percentage = (totalMarks / totalMaxMarks) * 100;

        return {
          name: student.name,
          rollNo: student.rollNo,
          percentage,
          result: student.result
        };
      })
      .filter(student => 
        student.percentage > 0 && 
        student.percentage < 70 && 
        student.result === 'PASS'
      )
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3)
      .map(student => ({
        name: student.name,
        rollNo: student.rollNo,
        percentage: formatPercentage(student.percentage)
      }));

    // Calculate class average
    const validStudents = currentStudents.filter(student => 
      student.result !== 'ABSENT' && 
      student.result !== 'WITHHELD'
    );

    let classAverage = 0;
    if (validStudents.length > 0) {
      const totalPercentage = validStudents.reduce((acc, student) => {
        const totalMarks = student.subjects.reduce((acc, subject) => {
          if (subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A') {
            return acc;
          }
          return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks));
        }, 0);

        const totalMaxMarks = student.subjects.reduce((acc, subject) => {
          return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks));
        }, 0);

        return acc + ((totalMarks / totalMaxMarks) * 100);
      }, 0);

      classAverage = totalPercentage / validStudents.length;
    }

    // Calculate subject-wise performance
    const subjectPerformance = {};
    if (currentStudents.length > 0 && currentStudents[0].subjects) {
      currentStudents[0].subjects.forEach(subject => {
        const subjectName = subject.subjectName;
        let totalPercentage = 0;
        let validCount = 0;

        currentStudents.forEach(student => {
          const subjectData = student.subjects.find(s => s.subjectName === subjectName);
          if (subjectData && 
              subjectData.internal_obtainedMarks !== 'A' && 
              subjectData.external_obtainedMarks !== 'A') {
            const obtained = Number(subjectData.internal_obtainedMarks) + Number(subjectData.external_obtainedMarks);
            const total = Number(subjectData.internal_maxMarks) + Number(subjectData.external_maxMarks);
            totalPercentage += (obtained / total) * 100;
            validCount++;
          }
        });

        if (validCount > 0) {
          subjectPerformance[subjectName] = totalPercentage / validCount;
        }
      });
    }

    setAnalytics({
      distribution,
      topPerformers,
      needsImprovement,
      classAverage: formatPercentage(classAverage),
      topScore: formatPercentage(topScore),
      passPercentage: formatPercentage(passPercentage),
      subjectPerformance
    })
  }, [studentResults, selectedClass, selectedSemester, selectedSession, courses])

  const generateExcelReport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Results');

    // Add title and metadata
    worksheet.addRow(['Performance Analysis Report']);
    worksheet.addRow(['']);  // Empty row for spacing
    worksheet.addRow([`Class: ${selectedClass} ${selectedSemester}`]);
    worksheet.addRow([`Session: ${selectedSession}`]);
    worksheet.addRow([`Generated on: ${new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })}`]);
    worksheet.addRow(['']);  // Empty row for spacing

    // Add column headers
    const headerRow = worksheet.addRow(['Name', 'Total Marks', 'Percentage', 'Division', 'Failed Subjects']);
    headerRow.font = { bold: true };
    
    // Add student data
    studentResults.forEach(result => {
      const failedSubjectsCount = result.subjects.reduce((acc, subject) => {
        const totalObtained = subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A'
          ? 0
          : Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks);
        const totalMin = Number(subject.internal_minMarks) + Number(subject.external_minMarks);
        return totalObtained < totalMin ? acc + 1 : acc;
      }, 0);

      const totalMarks = result.subjects.reduce((acc, subject) => {
        if (subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A') {
          return acc;
        }
        return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks));
      }, 0);

      const totalMaxMarks = result.subjects.reduce((acc, subject) => {
        return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks));
      }, 0);

      const percentage = formatPercentage((totalMarks / totalMaxMarks) * 100);

      worksheet.addRow([
        result.name,
        totalMarks,
        formatPercentage(percentage),
        result.result,
        failedSubjectsCount
      ]);
    });

    // Style title and metadata
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('A4').font = { bold: true };
    worksheet.getCell('A5').font = { bold: true };

    // Set column widths
    worksheet.columns = [
      { width: 30 },  // Name
      { width: 15 },  // Total Marks
      { width: 15 },  // Percentage
      { width: 15 },  // Division
      { width: 15 }   // Failed Subjects
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create blob and download
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${selectedClass}-${selectedSemester}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="container mx-auto p-4 space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1
              className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Class Analytics Dashboard</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select 
                value={selectedClass} 
                onValueChange={(value) => {
                  setSelectedClass(value)
                }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course, index) => (
                    <SelectItem key={index} value={course.name}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedSemester} 
                onValueChange={(value) => {
                  setSelectedSemester(value)
                  setSelectedSession("")
                }}
                disabled={!selectedClass}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCourseIndex !== "" && courses[selectedCourseIndex]?.semester?.map((semester, index) => (
                    <SelectItem key={index} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSession}
                onValueChange={setSelectedSession}
                disabled={!selectedSemester}>
                <SelectTrigger className="w-full sm:w-[200px]">
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
            </div>
          </CardContent>
        </Card>

        {selectedClass && selectedSemester && selectedSession ? (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Class Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPercentage(analytics.classAverage)}%</div>
                  <p className="text-base text-muted-foreground">Overall class performance</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Top Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPercentage(analytics.topScore)}%</div>
                  <p className="text-base text-muted-foreground">Highest percentage achieved</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Pass Percentage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPercentage(analytics.passPercentage)}%</div>
                  <p className="text-base text-muted-foreground">Students passed</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1" ref={chartRef}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-medium">
                    <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                    Student Distribution
                  </CardTitle>
                  <CardDescription>Distribution of students by performance level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pass', value: analytics.distribution.pass, color: COLORS.pass },
                            { name: 'Supply', value: analytics.distribution.supply, color: COLORS.supply },
                            { name: 'Fail', value: analytics.distribution.fail, color: COLORS.fail },
                            { name: 'Withheld', value: analytics.distribution.withheld, color: COLORS.withheld },
                            { name: 'Absent', value: analytics.distribution.absent, color: COLORS.absent }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Pass', value: analytics.distribution.pass, color: COLORS.pass },
                            { name: 'Supply', value: analytics.distribution.supply, color: COLORS.supply },
                            { name: 'Fail', value: analytics.distribution.fail, color: COLORS.fail },
                            { name: 'Withheld', value: analytics.distribution.withheld, color: COLORS.withheld },
                            { name: 'Absent', value: analytics.distribution.absent, color: COLORS.absent }
                          ].filter(item => item.value > 0)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend 
                          layout="horizontal" 
                          verticalAlign="bottom" 
                          align="center"
                          formatter={(value, entry, index) => {
                            const items = [
                              { name: 'Pass', value: analytics.distribution.pass },
                              { name: 'Supply', value: analytics.distribution.supply },
                              { name: 'Fail', value: analytics.distribution.fail },
                              { name: 'Withheld', value: analytics.distribution.withheld },
                              { name: 'Absent', value: analytics.distribution.absent }
                            ];
                            return `${items[index].name}: ${items[index].value}`;
                          }}
                        />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-medium">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    Subject Performance
                  </CardTitle>
                  <CardDescription>Average performance by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.keys(analytics.subjectPerformance).map(key => ({ 
                          name: key,
                          displayName: key.split(' ').reduce((acc, word, i, arr) => {
                            if (i === 0) return word;
                            if (i % 2 === 0 || word.includes('+')) return acc + '\n' + word;
                            return acc + ' ' + word;
                          }, ''),
                          average: analytics.subjectPerformance[key] 
                        }))}
                        margin={{ top: 20, right: 30, left: 60, bottom: 100 }}
                      >
                        <XAxis 
                          dataKey="displayName" 
                          angle={0}
                          textAnchor="middle"
                          height={100}
                          interval={0}
                          tick={{ 
                            fontSize: 16,
                            width: 100,
                            lineHeight: 20
                          }}
                          label={{ 
                            value: 'Subjects', 
                            position: 'bottom',
                            offset: 40,
                            style: { 
                              fontSize: '18px',
                              fontWeight: 500,
                              textAnchor: 'middle'
                            }
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 16 }}
                          ticks={[0, 20, 40, 60, 80, 100]} 
                          domain={[0, 100]} 
                          label={{ 
                            value: 'Average Score (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            offset: -45,
                            style: { 
                              fontSize: '18px',
                              fontWeight: 500,
                              textAnchor: 'middle'
                            }
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ fontSize: '16px' }}
                          formatter={(value, name, props) => [value.toFixed(1) + '%', props.payload.name]}
                        />
                        <Bar 
                          dataKey="average" 
                          fill="#3b82f6"
                          label={{
                            position: 'top',
                            formatter: (value) => `${value.toFixed(1)}%`,
                            style: { fontSize: '16px' }
                          }}
                        >
                          {Object.keys(analytics.subjectPerformance).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#3b82f6" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={downloadChartsPDF}
                variant="secondary"
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
                disabled={!studentResults.length}
              >
                <Download className="h-4 w-4" />
                Download Performance Charts
              </Button>
            </div>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Student Results Overview</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-blue-500">Loading results...</div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left p-4 pl-8 text-gray-600 font-semibold w-1/5">Name</th>
                            <th className="text-right p-4 text-gray-600 font-semibold w-1/5">Total Marks</th>
                            <th className="text-right p-4 text-gray-600 font-semibold w-1/5">Percentage</th>
                            <th className="text-center p-4 text-gray-600 font-semibold w-1/5">Division</th>
                            <th className="text-right p-4 pr-8 text-gray-600 font-semibold w-1/5">Failed Subjects</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentResults.map((result, index) => {
                            const totalMarks = result.subjects.reduce((acc, subject) => {
                              return acc + (Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks))
                            }, 0)

                            const totalMaxMarks = result.subjects.reduce((acc, subject) => {
                              return acc + (Number(subject.internal_maxMarks) + Number(subject.external_maxMarks))
                            }, 0)

                            const percentage = formatPercentage((totalMarks / totalMaxMarks) * 100)
                            const failedSubjects = result.subjects.reduce((acc, subject) => {
                              const total = Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
                              const minTotal = Number(subject.internal_minMarks) + Number(subject.external_minMarks)
                              return total < minTotal ? acc + 1 : acc
                            }, 0)

                            const division = result.result
                            const badgeColor = division === "PASS" ? "bg-green-500" : division === "SUPPLY" ? "bg-yellow-500" : division === "FAIL" ? "bg-red-500" : division === "ABSENT" ? "bg-amber-500" : "bg-gray-500"

                            return (
                              <tr 
                                key={index}
                                className="border-b border-gray-100 hover:bg-gray-50/50"
                              >
                                <td className="p-4 pl-8 text-base font-medium">{result.name}</td>
                                <td className="p-4 text-base">{totalMarks}</td>
                                <td className="p-4 text-base">{percentage}%</td>
                                <td className="p-4 text-center">
                                  <span className={`${badgeColor} text-white px-4 py-1 rounded-full text-sm font-medium`}>
                                    {division}
                                  </span>
                                </td>
                                <td className="p-4 pr-8 text-base">{failedSubjects}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={generateExcelReport}
                        variant="secondary"
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors"
                        disabled={!studentResults.length}
                      >
                        <Download className="h-4 w-4" />
                        Download Excel Report
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-blue-500" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Students with exceptional performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {analytics.topPerformers.map((student, index) => (
                      <div key={index} className="flex items-center">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.percentage.toFixed(2)}% Average
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Needs Improvement</CardTitle>
                  <CardDescription>Students requiring additional support</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.needsImprovement.map((student, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.percentage}% Average</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {student.failedSubjects} subjects below passing
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <BookOpen className="h-16 w-16 text-blue-500 mb-6" />
              <h2 className="text-2xl font-semibold mb-2">Select Class, Semester and Session</h2>
              <p className="text-muted-foreground text-center max-w-sm">
                Choose a class, semester and session from the dropdowns above to view the analytics dashboard.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}