import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongoose'
import ClassDetails from '../models/ClassDetails'
import Sessions from '../models/Sessions'
import StudentMarks from '../models/StudentMarks'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const course = searchParams.get('course')
    const semester = searchParams.get('semester')
    const session = searchParams.get('session')

    console.log('Fetching class details with params:', { course, semester, session })

    // Get class details (students)
    const classDetails = await ClassDetails.findOne({
      course,
      semester,
      session
    }).select('students')

    console.log('Class details found:', classDetails)

    // Get session details (subjects with marks criteria)
    const sessionDetails = await Sessions.findOne({
      'course._id': course,
      semester,
      session
    }).select('ssubjects')

    console.log('Session details found:', sessionDetails)

    if (!classDetails) {
      return NextResponse.json(
        { error: 'Class details not found' },
        { status: 404 }
      )
    }

    if (!sessionDetails) {
      return NextResponse.json(
        { error: 'Session details not found' },
        { status: 404 }
      )
    }

    // Format the response
    const response = {
      students: classDetails.students.map(student => ({
        id: student._id,
        name: student.name
      })),
      subjects: sessionDetails.ssubjects.map(subject => ({
        name: subject.name,
        internal_minMarks: subject.internal_minMarks,
        internal_maxMarks: subject.internal_maxMarks,
        external_minMarks: subject.external_minMarks,
        external_maxMarks: subject.external_maxMarks
      }))
    }

    console.log('Sending response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/marks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch class details: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const data = await request.json()

    console.log('Received POST request with data:', data)

    // Validate required fields
    if (!data.course || !data.semester || !data.session || !data.student || !data.subjects) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate total for each subject
    const subjectsWithTotal = data.subjects.map(subject => ({
      ...subject,
      total: subject.internal_obtainedMarks + subject.external_obtainedMarks
    }))

    console.log('Calculated totals for subjects:', subjectsWithTotal)

    // Create or update student marks
    const result = await StudentMarks.findOneAndUpdate(
      {
        course: data.course,
        semester: data.semester,
        session: data.session,
        student: data.student
      },
      {
        subjects: subjectsWithTotal
      },
      { upsert: true, new: true }
    )

    console.log('Updated student marks:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/marks:', error)
    return NextResponse.json(
      { error: 'Failed to save marks: ' + error.message },
      { status: 500 }
    )
  }
}
