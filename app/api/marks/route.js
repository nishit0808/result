import { NextResponse } from 'next/server'
import StudentMarks from '../models/StudentMarks'
import connectDB from '@/lib/mongoose'

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const course = searchParams.get('course')
    const semester = searchParams.get('semester')
    const session = searchParams.get('session')
    const student = searchParams.get('student')

    // Validate required parameters
    if (!course || !semester || !session || !student) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Find student marks
    const studentMarks = await StudentMarks.findOne({
      course,
      semester,
      session,
      'student.rollNo': student
    }).lean()

    if (!studentMarks) {
      return NextResponse.json({ error: 'Student marks not found' }, { status: 404 })
    }

    // Format marks data
    const formattedMarks = {
      student: studentMarks.student,
      course: studentMarks.course,
      semester: studentMarks.semester,
      session: studentMarks.session,
      subjects: studentMarks.subjects.map(subject => ({
        subjectName: subject.subjectName,
        internal_minMarks: subject.internal_minMarks,
        internal_maxMarks: subject.internal_maxMarks,
        internal_obtainedMarks: subject.internal_obtainedMarks,
        external_minMarks: subject.external_minMarks,
        external_maxMarks: subject.external_maxMarks,
        external_obtainedMarks: subject.external_obtainedMarks,
        total: subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A' 
          ? 'AB'
          : Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
      })),
      isWithheld: studentMarks.isWithheld || false,
      result: studentMarks.isWithheld 
        ? 'WITHHELD'
        : calculateResult(studentMarks.subjects),
      totalMarks: calculateTotalMarks(studentMarks.subjects),
      percentage: calculatePercentage(studentMarks.subjects),
      division: calculateDivision(studentMarks.subjects)
    }

    return NextResponse.json(formattedMarks)
  } catch (error) {
    console.error('Error in GET /api/marks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    const data = await request.json()
    const { course, semester, session, student, subjects, isWithheld } = data

    // Validate required fields
    if (!course || !semester || !session || !student || !subjects) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build filter for finding existing record
    const filter = {
      course,
      semester,
      session,
      'student.rollNo': student.rollNo
    }

    const update = {
      student,
      subjects: subjects.map(subject => ({
        ...subject,
        internal_obtainedMarks: subject.internal_obtainedMarks,
        external_obtainedMarks: subject.external_obtainedMarks
      })),
      isWithheld: isWithheld || false
    }

    const options = { 
      new: true, 
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }

    const result = await StudentMarks.findOneAndUpdate(filter, update, options)

    // Format the response
    const formattedResult = {
      student: result.student,
      course: result.course,
      semester: result.semester,
      session: result.session,
      subjects: result.subjects.map(subject => ({
        ...subject.toObject(),
        total: subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A' 
          ? 'AB' 
          : Number(subject.internal_obtainedMarks) + Number(subject.external_obtainedMarks)
      })),
      isWithheld: result.isWithheld,
      result: result.isWithheld 
        ? 'WITHHELD'
        : calculateResult(result.subjects),
      totalMarks: calculateTotalMarks(result.subjects),
      percentage: calculatePercentage(result.subjects),
      division: calculateDivision(result.subjects)
    }

    return NextResponse.json(formattedResult)
  } catch (error) {
    console.error('Error in POST /api/marks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function calculateResult(subjects) {
  if (!subjects || subjects.length === 0) return 'FAIL'

  // Check if student is absent in all subjects
  const allAbsent = subjects.every(subject => 
    subject.internal_obtainedMarks === 'A' && 
    subject.external_obtainedMarks === 'A'
  )
  if (allAbsent) return 'ABSENT'

  // Check if student is absent in any subject
  const anyAbsent = subjects.some(subject => 
    subject.internal_obtainedMarks === 'A' || 
    subject.external_obtainedMarks === 'A'
  )
  if (anyAbsent) return 'FAIL'

  // Check if student has failed in any subject
  const hasFailed = subjects.some(subject => {
    const internal = Number(subject.internal_obtainedMarks)
    const external = Number(subject.external_obtainedMarks)
    return internal < subject.internal_minMarks || 
           external < subject.external_minMarks
  })

  return hasFailed ? 'FAIL' : 'PASS'
}

function calculateTotalMarks(subjects) {
  if (!subjects || subjects.length === 0) return 0

  // If any subject has 'A' marks, return 'AB'
  const hasAbsent = subjects.some(subject => 
    subject.internal_obtainedMarks === 'A' || 
    subject.external_obtainedMarks === 'A'
  )
  if (hasAbsent) return 'AB'

  return subjects.reduce((total, subject) => {
    const internal = Number(subject.internal_obtainedMarks)
    const external = Number(subject.external_obtainedMarks)
    return total + internal + external
  }, 0)
}

function calculatePercentage(subjects) {
  if (!subjects || subjects.length === 0) return 0

  // If any subject has 'A' marks, return 0
  const hasAbsent = subjects.some(subject => 
    subject.internal_obtainedMarks === 'A' || 
    subject.external_obtainedMarks === 'A'
  )
  if (hasAbsent) return 0

  const totalObtained = subjects.reduce((total, subject) => {
    const internal = Number(subject.internal_obtainedMarks)
    const external = Number(subject.external_obtainedMarks)
    return total + internal + external
  }, 0)

  const totalMaximum = subjects.reduce((total, subject) => {
    return total + subject.internal_maxMarks + subject.external_maxMarks
  }, 0)

  return ((totalObtained / totalMaximum) * 100).toFixed(2)
}

function calculateDivision(subjects) {
  const percentage = Number(calculatePercentage(subjects))
  
  // Handle special cases
  if (percentage === 0) return 'NA'
  if (calculateResult(subjects) !== 'PASS') return 'NA'

  // Calculate division based on percentage
  if (percentage >= 75) return 'Distinction'
  if (percentage >= 60) return 'First'
  if (percentage >= 45) return 'Second'
  if (percentage >= 35) return 'Third'
  return 'NA'
}
