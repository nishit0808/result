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

  // Fetch sessions when course and semester are selected
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedCourse || !selectedSemester) {
        setSessions([])
        return
      }

      try {
        const response = await axios.get('/api/sessions')
        const filteredSessions = response.data
          .filter(session => session.course._id === selectedCourse)
          .map(session => session.session)
        
        const uniqueSessions = [...new Set(filteredSessions)]
        setSessions(uniqueSessions)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        setErrorMessage('Failed to load sessions')
      }
    }
    fetchSessions()
  }, [selectedCourse, selectedSemester])

  // Fetch class details and subjects when all selections are made
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

  // Handle subjects fetching
  useEffect(() => {
    console.log(`/api/sessions?course=${selectedCourseName}&semester=${selectedSemester}&session=${selectedSession}`)
    axios.get(`/api/sessions?course=${selectedCourseName}&semester=${selectedSemester}&session=${selectedSession}`)
      .then(response => {
        setSubjects(response.data)
      })
      .catch(error => {
        console.error('Error fetching subjects:', error)
        setErrorMessage('Failed to load subjects')
      })
  }, [selectedSession])

  useEffect(() => {
    console.log('Subjects:', subjects)
  }, [subjects])

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
        subjectName: mark.subjectName,
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
                                subjects[0].ssubjects.forEach((subject, index) => {
                                  console.log('Processing subject:', subject.name);
                                  
                                  let internalValue, externalValue;
                                  const availableColumns = Object.keys(studentData);
                                  let internalColumn, externalColumn;

                                  // Helper function to normalize text for comparison
                                  const normalizeText = (text) => {
                                    return text.replace(/\s+/g, ' ').trim().replace(/\r\n/g, '');
                                  };

                                  // Match columns based on subject name
                                  if (subject.name.includes('Calculus')) {
                                    internalColumn = availableColumns.find(col => 
                                      col.includes('Calculus') && !col.endsWith('_1')
                                    );
                                    externalColumn = availableColumns.find(col => 
                                      col.includes('Calculus') && col.endsWith('_1')
                                    );
                                  } 
                                  else if (subject.name.includes('Database Management System (BCA-202)')) {
                                    internalColumn = availableColumns.find(col => 
                                      col.includes('Database Management System') && 
                                      !col.endsWith('_1')
                                    );
                                    externalColumn = availableColumns.find(col => 
                                      col.includes('Database Management System') && 
                                      col.endsWith('_1')
                                    );
                                  }
                                  else if (subject.name.includes('Programming in C++')) {
                                    const normalizedSubject = normalizeText(subject.name);
                                    internalColumn = availableColumns.find(col => {
                                      const normalizedCol = normalizeText(col);
                                      return normalizedCol.includes('Programming in C++') && 
                                             normalizedCol.includes('BCA-203') && 
                                             !normalizedCol.includes('LAB') && 
                                             !col.endsWith('_1');
                                    });
                                    externalColumn = availableColumns.find(col => {
                                      const normalizedCol = normalizeText(col);
                                      return normalizedCol.includes('Programming in C++') && 
                                             normalizedCol.includes('BCA-203') && 
                                             !normalizedCol.includes('LAB') && 
                                             col.endsWith('_1');
                                    });
                                  }
                                  else if (subject.name.includes('Computer Networks')) {
                                    internalColumn = availableColumns.find(col => 
                                      col.includes('Computer Networks') && 
                                      !col.endsWith('_1')
                                    );
                                    externalColumn = availableColumns.find(col => 
                                      col.includes('Computer Networks') && 
                                      col.endsWith('_1')
                                    );
                                  }
                                  else if (subject.name.includes('Operating System with Linux')) {
                                    internalColumn = availableColumns.find(col => 
                                      col.includes('Operating System with Linux') && 
                                      !col.endsWith('_1')
                                    );
                                    externalColumn = availableColumns.find(col => 
                                      col.includes('Operating System with Linux') && 
                                      col.endsWith('_1')
                                    );
                                  }
                                  else if (subject.name.includes('Foundation Course')) {
                                    internalColumn = availableColumns.find(col => 
                                      col.includes('Foundation Course') && 
                                      !col.endsWith('_1')
                                    );
                                    externalColumn = availableColumns.find(col => 
                                      col.includes('Foundation Course') && 
                                      col.endsWith('_1')
                                    );
                                  }
                                  else if (subject.name.includes('LAB-IV: Programming')) {
                                    internalColumn = availableColumns.find(col => 
                                      col.includes('LAB-IV: Programming Lab') && 
                                      !col.endsWith('_1')
                                    );
                                    externalColumn = availableColumns.find(col => 
                                      col.includes('LAB-IV: Programming Lab') && 
                                      col.endsWith('_1')
                                    );
                                  }
                                  else if (subject.name.includes('LAB-V: Database')) {
                                    internalColumn = availableColumns.find(col => 
                                      col.includes('LAB-V: Database Management System Lab') && 
                                      !col.endsWith('_1')
                                    );
                                    externalColumn = availableColumns.find(col => 
                                      col.includes('LAB-V: Database Management System Lab') && 
                                      col.endsWith('_1')
                                    );
                                  }
                                  else if (subject.name.includes('LAB-V: Operating')) {
                                    internalColumn = availableColumns.find(col => 
                                      col.includes('LAB-V: Operating System Lab') && 
                                      col.includes('BCA-209') && 
                                      !col.endsWith('_1')
                                    );
                                    externalColumn = availableColumns.find(col => 
                                      col.includes('LAB-V: Operating System Lab') && 
                                      col.includes('BCA-209') && 
                                      col.endsWith('_1')
                                    );
                                  }

                                  if (internalColumn && externalColumn) {
                                    internalValue = studentData[internalColumn];
                                    externalValue = studentData[externalColumn];
                                    
                                    console.log('Found columns for', subject.name, ':', {
                                      internalColumn,
                                      externalColumn,
                                      internalValue,
                                      externalValue
                                    });

                                    newMarks[index] = {
                                      ...newMarks[index],
                                      internal_obtainedMarks: String(internalValue || ''),
                                      external_obtainedMarks: String(externalValue || '')
                                    };
                                  } else {
                                    console.log('Could not find columns for', subject.name);
                                    console.log('Looking for Programming in C++ in:', availableColumns.filter(col => 
                                      col.includes('Programming')
                                    ));
                                  }
                                });

                                console.log('New marks:', newMarks);
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

                  <Table className="w-full border-collapse border border-gray-300">
                    <TableHeader>
                      {/* First Row */}
                      <TableRow className="border border-gray-300">
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center" rowSpan={2}>
                          Subjects
                        </TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center" colSpan={3}>
                        Continuous Internal Assessment (CIA)
                        </TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center" colSpan={3}>
                        End Semester Examination (ESE)
                        </TableHead>
                      </TableRow>
                      {/* Second Row */}
                      <TableRow className="border border-gray-300">
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Min</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Max</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Marks</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Min</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Max</TableHead>
                        <TableHead className="border border-gray-300 font-mono font-semibold text-center">Marks</TableHead>
                      </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody>
                      {subjects[0].ssubjects.map((subject, index) => {
                        // Initialize marks array with subject details if not already done
                        if (marks.length === 0 || !marks[index]) {
                          const newMarks = [...marks];
                          newMarks[index] = {
                            subjectName: subject.name,
                            internal_minMarks: subject.internal_minMarks,
                            internal_maxMarks: subject.internal_maxMarks,
                            external_minMarks: subject.external_minMarks,
                            external_maxMarks: subject.external_maxMarks,
                            internal_obtainedMarks: '',
                            external_obtainedMarks: ''
                          };
                          setMarks(newMarks);
                        }
                        
                        return (
                          <TableRow key={index} className="border border-gray-300">
                            <TableCell className="border border-gray-300">{subject.name}</TableCell>
                            <TableCell className="border border-gray-300">
                              {subject.internal_minMarks}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              {subject.internal_maxMarks}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              <Input
                                type="text"
                                value={marks[index]?.internal_obtainedMarks || ''}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  if (value === '' || value === 'A' || (!isNaN(value) && Number(value) >= 0 && Number(value) <= subject.internal_maxMarks)) {
                                    handleMarksChange(index, "internal_obtainedMarks", value);
                                  }
                                }}
                                placeholder="Enter marks or 'A'"
                                className="text-center"
                              />
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              {subject.external_minMarks}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              {subject.external_maxMarks}
                            </TableCell>
                            <TableCell className="border border-gray-300">
                              <Input
                                type="text"
                                value={marks[index]?.external_obtainedMarks || ''}
                                onChange={(e) => {
                                  const value = e.target.value.toUpperCase();
                                  if (value === '' || value === 'A' || (!isNaN(value) && Number(value) >= 0 && Number(value) <= subject.external_maxMarks)) {
                                    handleMarksChange(index, "external_obtainedMarks", value);
                                  }
                                }}
                                placeholder="Enter marks or 'A'"
                                className="text-center"
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
