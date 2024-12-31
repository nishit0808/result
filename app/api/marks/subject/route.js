import { NextResponse } from "next/server"
import connectDB from "@/lib/mongoose"
import StudentMarks from "../../models/StudentMarks"

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

    // Find all student marks for the given criteria
    const studentMarks = await StudentMarks.find({
      course,
      semester,
      session
    }).populate('course').populate('student', 'name rollNo') // Populate student field to get the name and roll number

    if (!studentMarks || studentMarks.length === 0) {
      return NextResponse.json(
        { error: 'No marks found for the given criteria' },
        { status: 404 }
      )
    }

    // Extract subject-specific marks for each student
    const subjectMarks = studentMarks.map(student => {
      const subject = student.subjects.find(sub => sub.subjectName === subjectName)
      return {
        student: student.student.name, // Use the populated student name
        rollNo: student.student.rollNo, // Include roll number if available
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
