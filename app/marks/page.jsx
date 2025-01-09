'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toaster, toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function MarksEntryPage() {
  // State for dropdowns
  const [courses, setCourses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedCourseName, setSelectedCourseName] = useState('')

  // State for students and subjects
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [marks, setMarks] = useState([])

  // State for Excel file
  const [excelFile, setExcelFile] = useState(null)

  // Error and success messages
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for withheld checkbox
  const [isWithheld, setIsWithheld] = useState(false)

  // Clear messages after 3 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('')
        setSuccessMessage('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage, successMessage])

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/course')
        setCourses(response.data)
      } catch (error) {
        console.error('Error fetching courses:', error)
        setErrorMessage('Failed to load courses')
      }
    }
    fetchCourses()
  }, [])

  // Update semesters when course changes
  useEffect(() => {
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

  // Fetch sessions and subjects when course and semester are selected
  useEffect(() => {
    const fetchSessionsAndSubjects = async () => {
      if (!selectedCourse || !selectedSemester) {
        setSessions([])
        setSubjects([])
        return
      }

      try {
        // Fetch sessions
        const sessionsResponse = await axios.get('/api/sessions')
        const filteredSessions = sessionsResponse.data
          .filter(session => 
            session.course._id === selectedCourse && 
            session.semester === selectedSemester
          )
        
        // Get unique session values
        const uniqueSessions = [...new Set(filteredSessions.map(session => session.session))]
        setSessions(uniqueSessions)

        // If we have a selected session, get the subjects
        if (selectedSession) {
          const sessionData = filteredSessions.find(session => 
            session.session === selectedSession
          )
          
          if (sessionData && sessionData.ssubjects) {
            const subjectsList = sessionData.ssubjects.map(subject => ({
              _id: subject._id,
              name: subject.name,
              internal_maxMarks: subject.internal_maxMarks,
              internal_minMarks: subject.internal_minMarks,
              external_maxMarks: subject.external_maxMarks,
              external_minMarks: subject.external_minMarks
            }))
            setSubjects(subjectsList)
          } else {
            setSubjects([])
          }
        }
      } catch (error) {
        console.error('Error fetching sessions and subjects:', error)
        setErrorMessage('Failed to load sessions and subjects')
        setSessions([])
        setSubjects([])
      }
    }
    fetchSessionsAndSubjects()
  }, [selectedCourse, selectedSemester, selectedSession])

  // Fetch class details when all selections are made
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!selectedCourse || !selectedSemester || !selectedSession) {
        setStudents([])
        return
      }

      try {
        console.log('Fetching class details with:', {
          course: selectedCourse,
          semester: selectedSemester,
          session: selectedSession
        })

        const response = await axios.get('/api/class', {
          params: {
            course: selectedCourse,
            semester: selectedSemester,
            session: selectedSession
          }
        })

        console.log('Response from /api/class:', response.data[0])

        if (response.data[0].students ) {
          setStudents(response.data[0].students)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('Error fetching class details:', error.response?.data || error.message)
        setErrorMessage(error.response?.data?.error || 'Failed to load class details')
        setStudents([])
      }
    }
    fetchClassDetails()
  }, [selectedCourse, selectedSemester, selectedSession])

  // Handle marks input change
  const handleMarksChange = (index, field, value) => {
    const newMarks = [...marks];
    newMarks[index] = {
      ...newMarks[index],
      [field]: value
    };
    setMarks(newMarks);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedStudent || marks.some(mark => {
      const internal = mark.internal_obtainedMarks;
      const external = mark.external_obtainedMarks;
      return (internal === '' || external === '') || 
             ((internal !== 'A' && isNaN(internal)) || 
              (external !== 'A' && isNaN(external)));
    })) {
      toast.error('Please fill in all marks or mark as absent (A)');
      return;
    }

    // Validate maximum marks only for numeric entries
    for (const mark of marks) {
      if (mark.internal_obtainedMarks !== 'A' && 
          mark.external_obtainedMarks !== 'A' && 
          (Number(mark.internal_obtainedMarks) > mark.internal_maxMarks ||
           Number(mark.external_obtainedMarks) > mark.external_maxMarks)) {
        toast.error('Marks cannot exceed maximum limits');
        return;
      }
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Saving marks...')

    try {
      const marksData = marks.map(mark => ({
        subjectName: mark.name || mark.subjectName,
        subject: mark.subject,
        internal_minMarks: Number(mark.internal_minMarks),
        internal_maxMarks: Number(mark.internal_maxMarks),
        internal_obtainedMarks: mark.internal_obtainedMarks === 'A' ? 'A' : Number(mark.internal_obtainedMarks),
        external_minMarks: Number(mark.external_minMarks),
        external_maxMarks: Number(mark.external_maxMarks),
        external_obtainedMarks: mark.external_obtainedMarks === 'A' ? 'A' : Number(mark.external_obtainedMarks)
      }));

      const selectedStudentData = students.find(s => s.rollNo === selectedStudent);
      
      await axios.post('/api/marks', {
        course: selectedCourse,
        semester: selectedSemester,
        session: selectedSession,
        student: {
          rollNo: selectedStudentData.rollNo,
          enrollmentNo: selectedStudentData.enrollmentNo,
          name: selectedStudentData.name
        },
        subjects: marksData,
        isWithheld: isWithheld
      });

      toast.dismiss(loadingToast)
      toast.success('Marks saved successfully', {
        description: 'All student marks have been recorded.',
        duration: 2000,
      })

      // Reset form after delay
      setTimeout(() => {
        setSelectedStudent('')
        setMarks([])
      }, 2000)
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Failed to save marks', {
        description: error.response?.data?.message || error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800 p-4">
      <Toaster position="top-center" expand={true} richColors />
      <div className="container mx-auto">
        {/* Error and Success Messages */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Enter Student Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Selection Section */}
              <div className="space-y-2 p-4 border border-gray-200 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Course Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Course</label>
                    <Select 
                      value={selectedCourse} 
                      onValueChange={(value) => {
                        setSelectedCourse(value)
                        setSelectedSemester('')
                        setSelectedSession('')
                        setSelectedStudent('')
                      }}
                    >
                      <SelectTrigger>
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

                  {/* Semester Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Semester</label>
                    <Select 
                      value={selectedSemester} 
                      onValueChange={(value) => {
                        setSelectedSemester(value)
                        setSelectedSession('')
                        setSelectedStudent('')
                      }}
                      disabled={!selectedCourse}
                    >
                      <SelectTrigger>
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

                  {/* Session Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Session</label>
                    <Select 
                      value={selectedSession} 
                      onValueChange={(value) => {
                        setSelectedSession(value)
                        setSelectedStudent('')
                      }}
                      disabled={!selectedCourse || !selectedSemester}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Session" />
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

                  {/* Student Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Student</label>
                    <Select 
                      value={selectedStudent} 
                      onValueChange={setSelectedStudent}
                      disabled={!selectedCourse || !selectedSemester || !selectedSession}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Student" />
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
                </div>
              </div>

              {/* Excel Upload and Auto-Fill Section */}
              {selectedSession && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-medium">Auto-Fill Marks from Excel</h3>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setExcelFile(file);
                            toast.success('Excel file loaded');
                          }
                        }}
                        className="max-w-xs"
                      />
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!excelFile || !selectedStudent) {
                            toast.error('Please select both an Excel file and a student');
                            return;
                          }

                          try {
                            // Create a FileReader
                            const reader = new FileReader();
                            
                            reader.onload = (e) => {
                              try {
                                const data = new Uint8Array(e.target.result);
                                const workbook = XLSX.read(data, { type: 'array' });
                                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                                
                                console.log('Excel Data:', jsonData);
                                console.log('Looking for student with Roll No:', selectedStudent);

                                const studentData = jsonData.find(row => {
                                  console.log('Checking row:', row);
                                  console.log('Row Roll No.:', row['Roll No.']);
                                  return String(row['Roll No.']) === selectedStudent;
                                });

                                console.log('Found student data:', studentData);

                                if (!studentData) {
                                  toast.error('Student not found in Excel sheet');
                                  return;
                                }

                                const newMarks = [...marks];
                                subjects.forEach((subject, index) => {
                                  console.log('Processing subject:', subject.name);
                                  
                                  let internalValue, externalValue;
                                  const availableColumns = Object.keys(studentData);

                                  // Helper function to normalize text for comparison
                                  const normalizeText = (text) => {
                                    return text
                                      .replace(/\r\n/g, ' ')  // Replace newlines with space
                                      .replace(/\s+/g, ' ')   // Replace multiple spaces with single space
                                      .trim()
                                      .toLowerCase();
                                  };

                                  // Find matching columns
                                  const internalColumn = availableColumns.find(col => {
                                    const normalizedCol = normalizeText(col);
                                    const normalizedSubject = normalizeText(subject.name);
                                    return normalizedCol === normalizedSubject && !col.endsWith('_1');
                                  });

                                  const externalColumn = availableColumns.find(col => {
                                    const normalizedCol = normalizeText(col);
                                    const normalizedSubject = normalizeText(subject.name);
                                    return normalizedCol === normalizedSubject + '_1';
                                  });

                                  console.log('Column matching for:', subject.name, {
                                    internalColumn,
                                    externalColumn,
                                    availableNormalized: availableColumns.map(col => ({
                                      original: col,
                                      normalized: normalizeText(col)
                                    }))
                                  });

                                  if (internalColumn && externalColumn) {
                                    internalValue = studentData[internalColumn];
                                    externalValue = studentData[externalColumn];
                                    
                                    console.log('Found columns for', subject.name, ':', {
                                      internal: internalColumn,
                                      external: externalColumn,
                                      internalValue,
                                      externalValue
                                    });

                                    // Update marks array
                                    newMarks[index] = {
                                      ...newMarks[index],
                                      subjectName: subject.name,
                                      internal_obtainedMarks: String(internalValue),
                                      external_obtainedMarks: String(externalValue)
                                    };
                                  } else {
                                    console.log('Could not find columns for', subject.name);
                                    console.log('Available columns:', availableColumns);
                                    console.log('Looking for:', {
                                      internal: normalizeText(subject.name),
                                      external: normalizeText(subject.name) + '_1'
                                    });
                                  }
                                });

                                setMarks(newMarks);
                                toast.success('Marks filled successfully');
                              } catch (error) {
                                console.error('Error processing Excel:', error);
                                console.error('Error stack:', error.stack);
                                toast.error('Error processing Excel file: ' + error.message);
                              }
                            };

                            reader.onerror = (error) => {
                              console.error('FileReader error:', error);
                              toast.error('Error reading file');
                            };

                            // Read the file
                            reader.readAsArrayBuffer(excelFile);
                          } catch (error) {
                            console.error('Error processing Excel:', error);
                            console.error('Error stack:', error.stack);
                            toast.error('Error processing Excel file: ' + error.message);
                          }
                        }}
                        disabled={!excelFile || !selectedStudent}
                      >
                        Auto-Fill Marks
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Marks Entry Section */}
              {selectedStudent && subjects.length > 0 && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-md">
                  {/* Withheld Checkbox */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      id="withheld"
                      checked={isWithheld}
                      onChange={(e) => setIsWithheld(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label htmlFor="withheld" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Withhold Result
                    </label>
                    {isWithheld && (
                      <span className="text-xs text-red-500 dark:text-red-400 ml-2">
                        (Student's result will be withheld)
                      </span>
                    )}
                  </div>

                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2 w-[300px]">Subjects</TableHead>
                        <TableHead className="text-center py-2" colSpan={3}>
                          Continuous Internal Assessment (CIA)
                        </TableHead>
                        <TableHead className="text-center py-2" colSpan={3}>
                          End Semester Examination (ESE)
                        </TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead className="text-center py-1 px-2 w-[80px]">Min</TableHead>
                        <TableHead className="text-center py-1 px-2 w-[80px]">Max</TableHead>
                        <TableHead className="text-center py-1 px-2 w-[100px]">Marks</TableHead>
                        <TableHead className="text-center py-1 px-2 w-[80px]">Min</TableHead>
                        <TableHead className="text-center py-1 px-2 w-[80px]">Max</TableHead>
                        <TableHead className="text-center py-1 px-2 w-[100px]">Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject, index) => {
                        // Initialize marks array with subject details if not already done
                        if (marks.length === 0 || !marks[index]) {
                          const newMarks = [...marks];
                          newMarks[index] = {
                            subject: subject._id,
                            subjectName: subject.name,
                            name: subject.name,
                            internal_maxMarks: subject.internal_maxMarks,
                            internal_minMarks: subject.internal_minMarks,
                            external_maxMarks: subject.external_maxMarks,
                            external_minMarks: subject.external_minMarks,
                            internal_obtainedMarks: '',
                            external_obtainedMarks: ''
                          };
                          setMarks(newMarks);
                        }

                        return (
                          <TableRow key={subject._id} className="hover:bg-gray-50">
                            <TableCell className="py-1 px-4 w-[300px]">{subject.name}</TableCell>
                            <TableCell className="text-center py-1 px-2 w-[80px]">{subject.internal_minMarks}</TableCell>
                            <TableCell className="text-center py-1 px-2 w-[80px]">{subject.internal_maxMarks}</TableCell>
                            <TableCell className="text-center py-1 px-2 w-[100px]">
                              <Input
                                type="text"
                                value={marks[index]?.internal_obtainedMarks || ''}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  if (value === '' || value === 'A' || (!isNaN(value) && Number(value) >= 0 && Number(value) <= subject.internal_maxMarks)) {
                                    handleMarksChange(index, "internal_obtainedMarks", value);
                                  }
                                }}
                                placeholder="Enter marks"
                                className="w-24 h-8 text-center mx-auto text-base"
                              />
                            </TableCell>
                            <TableCell className="text-center py-1 px-2 w-[80px]">{subject.external_minMarks}</TableCell>
                            <TableCell className="text-center py-1 px-2 w-[80px]">{subject.external_maxMarks}</TableCell>
                            <TableCell className="text-center py-1 px-2 w-[100px]">
                              <Input
                                type="text"
                                value={marks[index]?.external_obtainedMarks || ''}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  if (value === '' || value === 'A' || (!isNaN(value) && Number(value) >= 0 && Number(value) <= subject.external_maxMarks)) {
                                    handleMarksChange(index, "external_obtainedMarks", value);
                                  }
                                }}
                                placeholder="Enter marks"
                                className="w-24 h-8 text-center mx-auto text-base"
                               />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <Button
                    onClick={handleSubmit}
                    className="w-full mt-4"
                    disabled={!marks.length || isSubmitting}
                  >
                    Save Marks
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
