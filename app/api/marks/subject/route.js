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

    if (!course || !semester || !session) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const query = {
      course,
      semester,
      session
    };

    if (subjectName) {
      query['subjects.subjectName'] = subjectName;
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
    const studentMarks = await StudentMarks.find(query)
      .populate('course', 'name')
      .select('student subjects')

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
          isWithheld: subject.isWithheld,
          marks: {
            internal_obtainedMarks: subject.internal_obtainedMarks,
            external_obtainedMarks: subject.external_obtainedMarks,
            total: subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A'
              ? 'AB'
              : subject.internal_obtainedMarks + subject.external_obtainedMarks,
            internal_maxMarks: subjectData.internal_maxMarks,
            external_maxMarks: subjectData.external_maxMarks,
            internal_minMarks: subjectData.internal_minMarks,
            external_minMarks: subjectData.external_minMarks,
            status: getSubjectStatus(subject)
          }
        }
      })
      .filter(mark => mark !== null)

    // Sort students by total marks in descending order
    subjectMarks.sort((a, b) => b.marks.total - a.marks.total)

    // Calculate class statistics
    const totalStudents = subjectMarks.length;
    const withheldResults = subjectMarks.filter(mark => mark.isWithheld).length;
    const absentStudents = subjectMarks.filter(mark => 
      !mark.isWithheld && (
        mark.marks.internal_obtainedMarks === 'A' || 
        mark.marks.external_obtainedMarks === 'A'
      )
    ).length;
    
    const passedStudents = subjectMarks.filter(mark => 
      !mark.isWithheld && 
      mark.marks.internal_obtainedMarks !== 'A' && 
      mark.marks.external_obtainedMarks !== 'A' &&
      mark.marks.internal_obtainedMarks >= subjectData.internal_minMarks &&
      mark.marks.external_obtainedMarks >= subjectData.external_minMarks
    ).length;

    const totalMarks = subjectMarks.reduce((sum, mark) => {
      if (mark.isWithheld || mark.marks.total === 'AB') return sum;
      return sum + (mark.marks.total === 'AB' ? 0 : mark.marks.total);
    }, 0);

    const averageMarks = totalStudents > (withheldResults + absentStudents) 
      ? totalMarks / (totalStudents - withheldResults - absentStudents) 
      : 0;

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
        failedStudents: totalStudents - passedStudents - withheldResults - absentStudents,
        absentStudents,
        withheldResults,
        passPercentage: ((passedStudents / (totalStudents - withheldResults)) * 100) || 0,
        averageMarks: Math.round(averageMarks * 100) / 100
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

function getSubjectStatus(subject) {
  // If either mark is 'A', student is absent
  if (subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A') {
    return 'ABSENT';
  }

  // Check if student has failed
  const internal = Number(subject.internal_obtainedMarks);
  const external = Number(subject.external_obtainedMarks);
  
  if (internal < subject.internal_minMarks || external < subject.external_minMarks) {
    return 'FAIL';
  }

  return 'PASS';
}
