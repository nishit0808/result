'use client'

import * as React from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, LabelList } from 'recharts'
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowUpDown, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf';
import { toast } from "@/components/ui/use-toast";

export function SubjectAnalysisComponent() {
  const [courses, setCourses] = React.useState([])
  const [semesters, setSemesters] = React.useState([])
  const [sessions, setSessions] = React.useState([])
  const [subjects, setSubjects] = React.useState([])
  const [allSessions, setAllSessions] = React.useState([])
  const [subjectData, setSubjectData] = React.useState(null)
  const [selectedCourse, setSelectedCourse] = React.useState("")
  const [selectedSemester, setSelectedSemester] = React.useState("")
  const [selectedSession, setSelectedSession] = React.useState("")
  const [selectedSubject, setSelectedSubject] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState({
    key: null,
    direction: 'asc'
  })

  // Fetch courses on component mount
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/course')
        setCourses(response.data || [])
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }
    fetchCourses()
  }, [])

  // Fetch all sessions on component mount
  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/api/sessions')
        setAllSessions(response.data || [])
      } catch (error) {
        console.error('Error fetching sessions:', error)
      }
    }
    fetchSessions()
  }, [])

  // Update semesters when course changes
  React.useEffect(() => {
    if (selectedCourse) {
      const selectedCourseData = courses.find(course => course._id === selectedCourse)
      setSemesters(selectedCourseData?.semester || [])
      setSelectedSemester("") // Reset semester selection
      setSelectedSession("") // Reset session selection
      setSelectedSubject("") // Reset subject selection
    }
  }, [selectedCourse, courses])

  // Update available sessions when course or semester changes
  React.useEffect(() => {
    if (selectedCourse && selectedSemester) {
      const filteredSessions = allSessions.filter(session => 
        session.course._id === selectedCourse && 
        session.semester === selectedSemester
      )
      const uniqueSessions = [...new Set(filteredSessions.map(session => session.session))]
      setSessions(uniqueSessions)
      setSelectedSession("") // Reset session selection
      setSelectedSubject("") // Reset subject selection
    } else {
      setSessions([])
    }
  }, [selectedCourse, selectedSemester, allSessions])

  // Update available subjects when course, semester, and session change
  React.useEffect(() => {
    if (selectedCourse && selectedSemester && selectedSession) {
      const sessionData = allSessions.find(session => 
        session.course._id === selectedCourse && 
        session.semester === selectedSemester &&
        session.session === selectedSession
      )
      
      if (sessionData) {
        const subjectsList = sessionData.ssubjects.map(subject => ({
          value: subject._id,
          label: subject.name
        }))
        setSubjects(subjectsList)
      } else {
        setSubjects([])
      }
      setSelectedSubject("") // Reset subject selection
    } else {
      setSubjects([])
    }
  }, [selectedCourse, selectedSemester, selectedSession, allSessions])

  // Fetch subject data when a subject is selected
  React.useEffect(() => {
    const fetchSubjectData = async () => {
      if (selectedCourse && selectedSemester && selectedSession && selectedSubject) {
        try {
          const sessionData = allSessions.find(session => 
            session.course._id === selectedCourse && 
            session.semester === selectedSemester &&
            session.session === selectedSession
          )
          
          const subject = sessionData?.ssubjects.find(s => s._id === selectedSubject)
          
          if (subject) {
            const response = await axios.get('/api/marks/subject', {
              params: {
                course: selectedCourse,
                semester: selectedSemester,
                session: selectedSession,
                subjectName: subject.name
              }
            })
            console.log(`/api/marks/subject?course=${selectedCourse}&semester=${selectedSemester}&session=${selectedSession}&subjectName=${subject.name}`)
            setSubjectData(response.data)
          }
        } catch (error) {
          console.error('Error fetching subject data:', error)
        }
      } else {
        setSubjectData(null)
      }
    }
    fetchSubjectData()
  }, [selectedCourse, selectedSemester, selectedSession, selectedSubject, allSessions])

  // Sorting function
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  // Get sorted data
  const sortedData = React.useMemo(() => {
    if (!subjectData?.data) return [];
    
    const sorted = [...subjectData.data];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'name':
            aValue = a.studentName;
            bValue = b.studentName;
            break;
          case 'internal':
            aValue = a.internalMarks === 'A' ? -1 : Number(a.internalMarks);
            bValue = b.internalMarks === 'A' ? -1 : Number(b.internalMarks);
            break;
          case 'external':
            aValue = a.externalMarks === 'A' ? -1 : Number(a.externalMarks);
            bValue = b.externalMarks === 'A' ? -1 : Number(b.externalMarks);
            break;
          case 'total':
            aValue = a.totalMarks === 'AB' ? -1 : Number(a.totalMarks);
            bValue = b.totalMarks === 'AB' ? -1 : Number(b.totalMarks);
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      });
    }
    return sorted;
  }, [subjectData?.data, sortConfig]);

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-2 h-4 w-4" />
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  // Process subject data for display
  const processSubjectData = React.useMemo(() => {
    if (!subjectData) return {
      classAverage: 0,
      passPercentage: 0,
      passFailCounts: { pass: 0, fail: 0, absent: 0 },
      maxMarks: { internal: 0, external: 0 }
    };

    const { data, statistics, subjectDetails } = subjectData;
    
    return {
      classAverage: Number(statistics.avgMarks) || 0,
      passPercentage: Number(statistics.passPercentage) || 0,
      passFailCounts: {
        pass: statistics.passCount || 0,
        fail: statistics.failCount || 0,
        absent: statistics.absentCount || 0
      },
      maxMarks: {
        internal: subjectDetails.internalMax || 0,
        external: subjectDetails.externalMax || 0
      }
    };
  }, [subjectData]);

  const { classAverage, passPercentage, passFailCounts, maxMarks } = processSubjectData;

  const marksDistribution = React.useMemo(() => {
    if (!subjectData?.data) return [];
    
    const ranges = [
      { min: 0, max: 20, label: '0-20' },
      { min: 21, max: 40, label: '21-40' },
      { min: 41, max: 60, label: '41-60' },
      { min: 61, max: 80, label: '61-80' },
      { min: 81, max: 100, label: '81-100' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: subjectData.data.filter(student => {
        if (student.totalMarks === 'AB' || typeof student.totalMarks !== 'number') return false;
        return student.totalMarks >= range.min && student.totalMarks <= range.max;
      }).length
    }));
  }, [subjectData]);

  // Calculate top performers
  const topPerformers = React.useMemo(() => {
    if (!subjectData?.data) return [];
    
    return subjectData.data
      .filter(student => 
        student.totalMarks !== 'AB' && 
        student.internalMarks !== 'A' && 
        student.externalMarks !== 'A'
      )
      .sort((a, b) => {
        const totalA = Number(a.totalMarks);
        const totalB = Number(b.totalMarks);
        if (totalB !== totalA) return totalB - totalA;
        // If total marks are equal, sort by internal marks
        return Number(b.internalMarks) - Number(a.internalMarks);
      })
      .slice(0, 5)
      .map((student, index) => ({
        name: student.studentName,
        rollNo: student.rollNo,
        total: student.totalMarks,
        internal: student.internalMarks,
        external: student.externalMarks,
        rank: index + 1
      }));
  }, [subjectData?.data]);

  const handleExportToExcel = () => {
    if (!subjectData?.data) return

    // Prepare data for export
    const exportData = subjectData.data.map(student => ({
      'Student Name': student.studentName,
      'Roll No': student.rollNo,
      'Total Marks': student.totalMarks
    }))

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Subject Analysis')

    // Generate file name
    const selectedCourseData = courses.find(course => course._id === selectedCourse)
    const selectedSubjectData = subjects.find(subject => subject.value === selectedSubject)
    const fileName = `${selectedCourseData?.name || 'Course'}_${selectedSemester || 'Sem'}_${selectedSubjectData?.label || 'Subject'}_Analysis.xlsx`

    // Save file
    XLSX.writeFile(wb, fileName)
  }

  const handleChartsDownload = async () => {
    try {
      const selectedCourseData = courses.find(course => course._id === selectedCourse);
      const selectedSubjectData = subjects.find(subject => subject.value === selectedSubject);
      const fileName = `${selectedCourseData?.name || 'Course'}_${selectedSemester || 'Sem'}_${selectedSubjectData?.label || 'Subject'}_Analysis.pdf`;

      // Initialize PDF with larger dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Get page dimensions in mm
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;

      // Add title
      pdf.setFontSize(18);
      pdf.text('Subject Analysis Report', pageWidth / 2, margin, { align: 'center' });
      
      // Add header information
      pdf.setFontSize(12);
      pdf.text([
        `Class: ${selectedCourseData?.name || '-'} ${selectedSemester || '-'}`,
        `Subject: ${selectedSubjectData?.label || '-'}`,
        `Session: ${selectedSession || '-'}`
      ], margin, margin + 15);

      // Add statistics
      pdf.text('Statistics:', margin, margin + 40);
      pdf.text([
        `Class Average: ${classAverage.toFixed(2)}`,
        `Pass Percentage: ${passPercentage.toFixed(2)}%`,
        `Passed: ${passFailCounts.pass}  Failed: ${passFailCounts.fail}  Absent: ${passFailCounts.absent}`
      ], margin + 5, margin + 50);

      // Add Marks Distribution Chart
      const marksChart = document.getElementById('marksDistributionChart');
      if (marksChart) {
        try {
          const canvas = await html2canvas(marksChart, {
            scale: 2, // Increase quality
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          
          // Convert canvas to image
          const chartImage = canvas.toDataURL('image/jpeg', 1.0);
          
          // Add chart title
          pdf.text('Marks Distribution:', margin, margin + 80);
          
          // Calculate dimensions to maintain aspect ratio
          const chartWidth = pageWidth - (margin * 2);
          const chartHeight = (canvas.height * chartWidth) / canvas.width;
          
          // Add the chart image
          pdf.addImage(
            chartImage,
            'JPEG',
            margin,
            margin + 85,
            chartWidth,
            chartHeight,
            undefined,
            'FAST'
          );
          
        } catch (chartError) {
          console.error('Error capturing chart:', chartError);
          pdf.text('Error: Could not generate chart image', margin, margin + 85);
        }
      }

      // Add footer
      pdf.setFontSize(10);
      pdf.text(
        `Generated on: ${new Date().toLocaleDateString()}`,
        margin,
        pageHeight - margin
      );

      // Save PDF
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Subject Selection Card */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              Subject Analysis
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
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

              <Select value={selectedSession} onValueChange={setSelectedSession}>
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

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedSubject && (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Class Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classAverage.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Out of 100</p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass Percentage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{passPercentage ? passPercentage.toFixed(2) : '0.00'}%</div>
                  <Progress value={passPercentage || 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass/Fail Counts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{passFailCounts.pass}</div>
                      <p className="text-xs text-muted-foreground">Passed</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{passFailCounts.fail}</div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{passFailCounts.absent}</div>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Performance Analysis Table */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Student Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('name')}
                          className="hover:bg-transparent flex items-center"
                        >
                          Name {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('internal')}
                          className="hover:bg-transparent flex items-center justify-center mx-auto"
                        >
                          CIA ({maxMarks.internal}) {getSortIcon('internal')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('external')}
                          className="hover:bg-transparent flex items-center justify-center mx-auto"
                        >
                          ESE ({maxMarks.external}) {getSortIcon('external')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('total')}
                          className="hover:bg-transparent flex items-center justify-center mx-auto"
                        >
                          Total ({maxMarks.internal + maxMarks.external}) {getSortIcon('total')}
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{student.studentName}</TableCell>
                        <TableCell className="text-center">{student.internalMarks}</TableCell>
                        <TableCell className="text-center">{student.externalMarks}</TableCell>
                        <TableCell className="text-center">
                          {student.totalMarks === 'AB' ? 'AB' : student.totalMarks}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={handleExportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!subjectData?.data}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts and Top Performers Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Marks Distribution Chart */}
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Marks Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div id="marksDistributionChart" className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={marksDistribution}
                        margin={{ top: 30, right: 30, left: 30, bottom: 30 }}
                        barSize={40}
                      >
                        <XAxis 
                          dataKey="range" 
                          label={{ 
                            value: 'Marks Range->', 
                            position: 'bottom',
                            offset: -5,
                            fontSize: 18
                          }}
                          tick={{ fontSize: 14 }}
                        />
                        <YAxis 
                          label={{ 
                            value: 'Number of Students->', 
                            angle: -90, 
                            position: 'insideCenterRight',
                            offset: -10,
                            fontSize: 18
                          }}
                          tick={{ fontSize: 14 }}
                          domain={[0, 'auto']}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} students`, 'Count']}
                          labelFormatter={(label) => `Range: ${label}`}
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                          contentStyle={{ fontSize: '14px' }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        >
                          <LabelList 
                            dataKey="count" 
                            position="top" 
                            formatter={(value) => value > 0 ? value : ''}
                            style={{ fontSize: '14px', fill: '#666' }}
                            offset={10}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers Card */}
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.map((student) => (
                      <div 
                        key={student.rollNo} 
                        className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge 
                            className={
                              student.rank === 1 
                                ? "bg-yellow-500 hover:bg-yellow-600" 
                                : student.rank === 2 
                                ? "bg-gray-400 hover:bg-gray-500" 
                                : student.rank === 3 
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-blue-500 hover:bg-blue-600"
                            }
                          >
                            #{student.rank}
                          </Badge>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              CIA: {student.internal} | ESE: {student.external}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{student.total}</p>
                          <p className="text-sm text-muted-foreground">Total Marks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleChartsDownload}
                variant="secondary"
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors"
                disabled={!selectedSubject || !subjectData?.data}
              >
                <Download className="h-4 w-4" />
                Download PDF Report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}