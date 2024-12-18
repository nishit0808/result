import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongoose'
import ClassDetails from '../models/ClassDetails'
import Sessions from '../models/Sessions'
import StudentMarks from '../models/StudentMarks'
import mongoose from 'mongoose'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const course = searchParams.get('course')
    const semester = searchParams.get('semester')
    const session = searchParams.get('session')
    const student = searchParams.get('student')

    console.log('Fetching student marks with params:', { course, semester, session, student })

    // Find student marks directly
    const studentMarks = await StudentMarks.findOne({
      course,
      semester,
      session,
      student
    }).populate('course')

    console.log('Student marks found:', studentMarks)

    if (!studentMarks) {
      return NextResponse.json(
        { error: 'Student marks not found' },
        { status: 404 }
      )
    }

    // Format the response to match the frontend expectations
    const response = {
      studentInfo: {
        course: studentMarks.course,
        semester: studentMarks.semester,
        session: studentMarks.session,
        student: studentMarks.student
      },
      subjects: studentMarks.subjects.map(subject => ({
        subjectName: subject.subjectName,
        internal_minMarks: subject.internal_minMarks,
        internal_maxMarks: subject.internal_maxMarks,
        internal_obtainedMarks: subject.internal_obtainedMarks,
        external_minMarks: subject.external_minMarks,
        external_maxMarks: subject.external_maxMarks,
        external_obtainedMarks: subject.external_obtainedMarks,
        total: subject.total
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/marks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Step 1: Connect to the database
    await connectDB()

    // Step 2: Parse JSON data from the request
    const data = await request.json()
    console.log('Received POST request with data:', JSON.stringify(data, null, 2))

    // Step 3: Validate required fields
    if (!data.course || !data.semester || !data.session || !data.student || !data.subjects) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Step 4: Calculate total for each subject and validate inputs
    const subjectsWithTotal = data.subjects.map(subject => {
      // Check for required marks fields
      if (
        subject.internal_obtainedMarks === undefined ||
        subject.external_obtainedMarks === undefined
      ) {
        throw new Error(`Missing marks for subject: ${subject.subjectName}`)
      }

      // Convert string values to numbers and calculate total
      const internalMarks = Number(subject.internal_obtainedMarks)
      const externalMarks = Number(subject.external_obtainedMarks)

      if (isNaN(internalMarks) || isNaN(externalMarks)) {
        throw new Error(`Invalid marks for subject: ${subject.subjectName}`)
      }

      return {
        ...subject,
        internal_obtainedMarks: internalMarks,
        external_obtainedMarks: externalMarks,
        total: internalMarks + externalMarks
      }
    })

    console.log('Calculated totals for subjects:', subjectsWithTotal)

    // Step 5: Upsert student marks
    const result = await StudentMarks.findOneAndUpdate(
      {
        course: new mongoose.Types.ObjectId(data.course),
        semester: data.semester,
        session: data.session,
        student: data.student
      },
      {
        course: new mongoose.Types.ObjectId(data.course),
        semester: data.semester,
        session: data.session,
        student: data.student,
        subjects: subjectsWithTotal
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    console.log('Updated student marks:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/marks:', error.message)
    return NextResponse.json(
      { error: 'Failed to save marks: ' + error.message },
      { status: 500 }
    )
  }
}
