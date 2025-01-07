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
  const sortData = React.useCallback((data, key, direction) => {
    if (!data) return data;

    const sortedData = [...data].sort((a, b) => {
      let aValue, bValue;
      
      switch(key) {
        case 'internal':
          aValue = a.marks.internal_obtainedMarks;
          bValue = b.marks.internal_obtainedMarks;
          break;
        case 'external':
          aValue = a.marks.external_obtainedMarks;
          bValue = b.marks.external_obtainedMarks;
          break;
        case 'total':
          aValue = a.marks.total;
          bValue = b.marks.total;
          break;
        case 'name':
          aValue = a.student.toLowerCase();
          bValue = b.student.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedData;
  }, []);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      const newDirection = 
        prevConfig.key === key && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc';
      return {
        key,
        direction: newDirection
      };
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-2 h-4 w-4" />
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  const classAverage = React.useMemo(() => {
    return subjectData?.statistics?.classAverage || 0
  }, [subjectData])

  const passFailCounts = React.useMemo(() => {
    if (!subjectData) return { pass: 0, fail: 0 }
    return {
      pass: subjectData.statistics.passedStudents,
      fail: subjectData.statistics.failedStudents
    }
  }, [subjectData])

  const passPercentage = React.useMemo(() => {
    return subjectData?.statistics?.passPercentage || 0
  }, [subjectData])

  const topPerformers = React.useMemo(() => {
    if (!subjectData?.students) return []
    return [...subjectData.students]
      .sort((a, b) => b.marks.total - a.marks.total)
      .slice(0, 3)
  }, [subjectData])

  const marksDistribution = React.useMemo(() => {
    if (!subjectData?.students) return []
    const distribution = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ]
    subjectData.students.forEach(student => {
      const total = student.marks.total
      if (total <= 20) distribution[0].count++
      else if (total <= 40) distribution[1].count++
      else if (total <= 60) distribution[2].count++
      else if (total <= 80) distribution[3].count++
      else distribution[4].count++
    })
    return distribution
  }, [subjectData])

  const gradeDistribution = React.useMemo(() => {
    if (!subjectData?.students) return []
    const distribution = [
      { grade: 'A', count: 0 },
      { grade: 'B', count: 0 },
      { grade: 'C', count: 0 },
      { grade: 'D', count: 0 },
      { grade: 'F', count: 0 },
    ]
    subjectData.students.forEach(student => {
      const total = student.marks.total
      if (total >= 90) distribution[0].count++
      else if (total >= 80) distribution[1].count++
      else if (total >= 70) distribution[2].count++
      else if (total >= 60) distribution[3].count++
      else distribution[4].count++
    })
    return distribution
  }, [subjectData])

  const handleExportToExcel = () => {
    if (!subjectData?.students) return

    // Prepare data for export
    const exportData = subjectData.students.map(student => ({
      'Student Name': student.student,
      'CIA Score': `${student.marks.internal_obtainedMarks}/${student.marks.internal_maxMarks}`,
      'ESE Score': `${student.marks.external_obtainedMarks}/${student.marks.external_maxMarks}`,
      'Total Score': `${student.marks.total}/${student.marks.internal_maxMarks + student.marks.external_maxMarks}`
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
      const selectedCourseData = courses.find(course => course._id === selectedCourse)
      const selectedSubjectData = subjects.find(subject => subject.value === selectedSubject)
      const baseFileName = `${selectedCourseData?.name || 'Course'}_${selectedSemester || 'Sem'}_${selectedSubjectData?.label || 'Subject'}`

      // Download Marks Distribution Chart
      const marksChart = document.getElementById('marksDistributionChart')
      if (marksChart) {
        const marksCanvas = await html2canvas(marksChart)
        const marksUrl = marksCanvas.toDataURL('image/png')
        const marksLink = document.createElement('a')
        marksLink.download = `${baseFileName}_MarksDistribution.png`
        marksLink.href = marksUrl
        document.body.appendChild(marksLink)
        marksLink.click()
        document.body.removeChild(marksLink)
      }

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500))

      // Download Grade Distribution Chart
      const gradeChart = document.getElementById('gradeDistributionChart')
      if (gradeChart) {
        const gradeCanvas = await html2canvas(gradeChart)
        const gradeUrl = gradeCanvas.toDataURL('image/png')
        const gradeLink = document.createElement('a')
        gradeLink.download = `${baseFileName}_GradeDistribution.png`
        gradeLink.href = gradeUrl
        document.body.appendChild(gradeLink)
        gradeLink.click()
        document.body.removeChild(gradeLink)
      }
    } catch (error) {
      console.error('Error downloading charts:', error)
    }
  }

  return (
    (<div
      className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800">
      <div className="container mx-auto p-4 space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <h1
              className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  <div className="text-2xl font-bold">{passPercentage.toFixed(2)}%</div>
                  <Progress value={passPercentage} className="mt-2" />
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
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {topPerformers.map((student, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>Student {index + 1}</span>
                        <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                          {student.marks.total}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Student Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('name')}
                          className="hover:bg-transparent"
                        >
                          Name
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('internal')}
                          className="hover:bg-transparent"
                        >
                          Continuous Internal Assessment (CIA)
                          {getSortIcon('internal')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('external')}
                          className="hover:bg-transparent"
                        >
                          End Semester Examination (ESE)
                          {getSortIcon('external')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort('total')}
                          className="hover:bg-transparent"
                        >
                          Total
                          {getSortIcon('total')}
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortData(subjectData?.students, sortConfig.key, sortConfig.direction)?.map((student) => (
                      <TableRow key={student.enrollmentNo}>
                        <TableCell>{student.student}</TableCell>
                        <TableCell className="text-center">
                          {student.marks.internal_obtainedMarks} / {student.marks.internal_maxMarks}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.marks.external_obtainedMarks} / {student.marks.external_maxMarks}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.marks.total} / {student.marks.internal_maxMarks + student.marks.external_maxMarks}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={handleExportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!subjectData?.students}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Marks Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div id="marksDistributionChart" className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marksDistribution} margin={{ top: 25, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" barSize={35}>
                          <LabelList dataKey="count" position="top" offset={10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div id="gradeDistributionChart" className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeDistribution} margin={{ top: 25, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="grade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" barSize={35}>
                          <LabelList dataKey="count" position="top" offset={10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleChartsDownload}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!subjectData?.students}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Charts
              </Button>
            </div>
          </>
        )}
      </div>
    </div>)
  );
}