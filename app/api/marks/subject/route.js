import { NextResponse } from "next/server"
import connectDB from "@/lib/mongoose"
import StudentMarks from "../../models/StudentMarks"
import ClassDetails from "../../models/ClassDetails"

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

    // First, get the class details to get student names
    const classDetails = await ClassDetails.findOne({
      course,
      semester,
      session
    })

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
      session
    }).populate('course')

    if (!studentMarks || studentMarks.length === 0) {
      return NextResponse.json(
        { error: 'No marks found for the given criteria' },
        { status: 404 }
      )
    }

    // Extract subject-specific marks for each student
    const subjectMarks = studentMarks.map(studentMark => {
      const subject = studentMark.subjects.find(sub => sub.subjectName === subjectName)
      // Find student details from classDetails
      const studentDetails = classDetails.students.find(student => student.uid === studentMark.student)
      
      return {
        student: studentDetails ? studentDetails.name : studentMark.student, // Use name if found, fallback to ID
        enrollmentNo: studentDetails?.enrollmentNo,
        marks: subject ? {
          internal_obtainedMarks: subject.internal_obtainedMarks,
          external_obtainedMarks: subject.external_obtainedMarks,
          total: subject.total,
          internal_maxMarks: subject.internal_maxMarks,
          external_maxMarks: subject.external_maxMarks,
          internal_minMarks: subject.internal_minMarks,
          external_minMarks: subject.external_minMarks
        } : null
      }
    }).filter(mark => mark.marks !== null)

    // Sort students by total marks in descending order
    subjectMarks.sort((a, b) => b.marks.total - a.marks.total)

    // Calculate class statistics
    const totalStudents = subjectMarks.length
    const passedStudents = subjectMarks.filter(mark => 
      mark.marks.total >= (mark.marks.internal_minMarks + mark.marks.external_minMarks)
    ).length
    
    const totalMarks = subjectMarks.reduce((sum, mark) => sum + mark.marks.total, 0)
    const averageMarks = totalMarks / totalStudents

    const response = {
      courseInfo: {
        course: studentMarks[0].course,
        semester,
        session,
        subjectName
      },
      statistics: {
        totalStudents,
        passedStudents,
        failedStudents: totalStudents - passedStudents,
        passPercentage: (passedStudents / totalStudents) * 100,
        classAverage: averageMarks
      },
      students: subjectMarks
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/marks/subject:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
