import { NextResponse } from "next/server"
import connectDB from "@/lib/mongoose"
import StudentMarks from "../../models/StudentMarks"
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

    // First, get subject details from session
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

    const subjectDetails = sessionData.ssubjects.find(s => s.name === subjectName)
    if (!subjectDetails) {
      return NextResponse.json(
        { error: 'Subject not found in session' },
        { status: 404 }
      )
    }

    // Get marks data for the subject
    const marksData = await StudentMarks.find({
      course,
      semester,
      session,
      'subjects.subjectName': subjectName
    })
    .populate('student', 'name rollNo')
    .lean()
    .exec();

    if (!marksData || marksData.length === 0) {
      return NextResponse.json(
        { error: 'No marks data found' },
        { status: 404 }
      )
    }

    // Process the marks data
    const processedData = marksData.map(record => {
      const subjectMarks = record.subjects.find(s => s.subjectName === subjectName)
      if (!subjectMarks) return null

      return {
        studentName: record.student.name,
        rollNo: record.student.rollNo,
        internalMarks: subjectMarks.internal_obtainedMarks,
        externalMarks: subjectMarks.external_obtainedMarks,
        totalMarks: calculateTotalMarks(subjectMarks),
        maxMarks: subjectMarks.internal_maxMarks + subjectMarks.external_maxMarks,
        result: calculateResult(subjectMarks)
      }
    }).filter(Boolean)

    // Calculate statistics
    const statistics = calculateStatistics(processedData, subjectDetails)

    return NextResponse.json({
      data: processedData,
      statistics: statistics,
      subjectDetails: {
        name: subjectDetails.name,
        internalMax: subjectDetails.internal_maxMarks,
        externalMax: subjectDetails.external_maxMarks,
        internalMin: subjectDetails.internal_minMarks,
        externalMin: subjectDetails.external_minMarks
      }
    })

  } catch (error) {
    console.error('Error in subject marks API:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

function calculateTotalMarks(marks) {
  const internal = marks.internal_obtainedMarks === 'A' ? 0 : Number(marks.internal_obtainedMarks)
  const external = marks.external_obtainedMarks === 'A' ? 0 : Number(marks.external_obtainedMarks)
  return internal + external
}

function calculateResult(marks) {
  const internal = marks.internal_obtainedMarks === 'A' ? 0 : Number(marks.internal_obtainedMarks)
  const external = marks.external_obtainedMarks === 'A' ? 0 : Number(marks.external_obtainedMarks)
  
  if (marks.internal_obtainedMarks === 'A' || marks.external_obtainedMarks === 'A') {
    return 'Absent'
  }
  
  if (internal < marks.internal_minMarks || external < marks.external_minMarks) {
    return 'Fail'
  }
  
  return 'Pass'
}

function calculateStatistics(data, subjectDetails) {
  const totalStudents = data.length
  if (totalStudents === 0) return null

  const totalMarks = data.reduce((sum, student) => sum + student.totalMarks, 0)
  const avgMarks = totalMarks / totalStudents

  const passCount = data.filter(student => student.result === 'Pass').length
  const failCount = data.filter(student => student.result === 'Fail').length
  const absentCount = data.filter(student => student.result === 'Absent').length

  const maxMarks = Math.max(...data.map(student => student.totalMarks))
  const minMarks = Math.min(...data.map(student => student.totalMarks))

  return {
    totalStudents,
    avgMarks: avgMarks.toFixed(2),
    passCount,
    failCount,
    absentCount,
    passPercentage: ((passCount / totalStudents) * 100).toFixed(2),
    maxMarks,
    minMarks
  }
}
