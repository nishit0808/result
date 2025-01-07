import { NextResponse } from "next/server"
import connectDB from "@/lib/mongoose"
import StudentMarks from "../../models/StudentMarks"
import ClassDetails from "../../models/ClassDetails"
import Sessions from "../../models/Sessions"

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const course = searchParams.get('course')
    const semester = searchParams.get('semester')
    const session = searchParams.get('session')
    const subjectName = searchParams.get('subjectName')

    console.log('Fetching subject marks with params:', { course, semester, session, subjectName })

    if (!course || !semester || !session || !subjectName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // First, verify if this subject exists in the session and get subject details
    const sessionData = await Sessions.findOne({
      course,
      semester,
      session
    }).populate('ssubjects')

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get the subject details including min marks from session data
    const subjectData = sessionData.ssubjects.find(sub => sub.name === subjectName)
    if (!subjectData) {
      return NextResponse.json(
        { error: 'Subject not found in this session' },
        { status: 404 }
      )
    }

    // Get the class details to get student names
    const classDetails = await ClassDetails.findOne({
      course,
      semester,
      session
    }).populate('students.uid')

    if (!classDetails) {
      return NextResponse.json(
        { error: 'Class details not found' },
        { status: 404 }
      )
    }

    // Find all student marks for the given criteria
    const studentMarks = await StudentMarks.find({
      course,
      semester,
      session,
      'subjects.subjectName': subjectName
    }).populate('course')

    if (!studentMarks || studentMarks.length === 0) {
      return NextResponse.json(
        { error: 'No marks found for the given criteria' },
        { status: 404 }
      )
    }

    // Create a map of student IDs from class details for quick lookup
    const classStudentsMap = new Map(
      classDetails.students.map(student => [student.uid.toString(), student])
    )

    // Extract subject-specific marks for each student
    const subjectMarks = studentMarks
      .filter(studentMark => {
        // Only include students who are in the class
        return classStudentsMap.has(studentMark.student.toString())
      })
      .map(studentMark => {
        const subject = studentMark.subjects.find(sub => sub.subjectName === subjectName)
        const studentDetails = classStudentsMap.get(studentMark.student.toString())
        
        if (!subject || !studentDetails) return null

        return {
          student: studentDetails.name,
          enrollmentNo: studentDetails.enrollmentNo,
          marks: {
            internal_obtainedMarks: subject.internal_obtainedMarks,
            external_obtainedMarks: subject.external_obtainedMarks,
            total: subject.total,
            internal_maxMarks: subjectData.internal_maxMarks,
            external_maxMarks: subjectData.external_maxMarks,
            internal_minMarks: subjectData.internal_minMarks,
            external_minMarks: subjectData.external_minMarks
          }
        }
      })
      .filter(mark => mark !== null)

    // Sort students by total marks in descending order
    subjectMarks.sort((a, b) => b.marks.total - a.marks.total)

    // Calculate class statistics
    const totalStudents = subjectMarks.length
    const passedStudents = subjectMarks.filter(mark => 
      mark.marks.internal_obtainedMarks >= subjectData.internal_minMarks &&
      mark.marks.external_obtainedMarks >= subjectData.external_minMarks
    ).length
    
    const totalMarks = subjectMarks.reduce((sum, mark) => sum + mark.marks.total, 0)
    const averageMarks = totalStudents > 0 ? totalMarks / totalStudents : 0

    const response = {
      courseInfo: {
        course: studentMarks[0].course,
        semester,
        session,
        subjectName
      },
      subjectInfo: {
        internal_maxMarks: subjectData.internal_maxMarks,
        external_maxMarks: subjectData.external_maxMarks,
        internal_minMarks: subjectData.internal_minMarks,
        external_minMarks: subjectData.external_minMarks
      },
      statistics: {
        totalStudents,
        passedStudents,
        failedStudents: totalStudents - passedStudents,
        passPercentage: totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0,
        classAverage: averageMarks
      },
      students: subjectMarks
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in subject marks API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
