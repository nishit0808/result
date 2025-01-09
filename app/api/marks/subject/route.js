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
    .lean()
    .exec();

    if (!marksData || marksData.length === 0) {
      return NextResponse.json(
        { error: 'No marks data found for the subject' },
        { status: 404 }
      )
    }

    // Process the marks data
    const processedData = marksData.map(record => {
      const subjectMarks = record.subjects.find(s => 
        s.subjectName === subjectName || s.name === subjectName
      );
      
      if (!subjectMarks) return null;

      const internalMarks = subjectMarks.internal_obtainedMarks;
      const externalMarks = subjectMarks.external_obtainedMarks;
      const totalMarks = internalMarks === 'A' || externalMarks === 'A' 
        ? 'AB'
        : Number(internalMarks) + Number(externalMarks);

      return {
        studentName: record.student?.name || 'Unknown',
        rollNo: record.student?.rollNo || 'Unknown',
        internalMarks,
        externalMarks,
        totalMarks,
        result: internalMarks === 'A' || externalMarks === 'A'
          ? 'ABSENT'
          : Number(internalMarks) >= subjectMarks.internal_minMarks &&
            Number(externalMarks) >= subjectMarks.external_minMarks
            ? 'PASS'
            : 'FAIL'
      }
    }).filter(Boolean);

    // Calculate statistics
    const totalStudents = processedData.length;
    const passedStudents = processedData.filter(data => data.result === 'PASS').length;
    const failedStudents = processedData.filter(data => data.result === 'FAIL').length;
    const absentStudents = processedData.filter(data => data.result === 'ABSENT').length;
    
    const validMarks = processedData.filter(data => data.result !== 'ABSENT');
    const classAverage = validMarks.length > 0
      ? validMarks.reduce((sum, data) => sum + (typeof data.totalMarks === 'number' ? data.totalMarks : 0), 0) / validMarks.length
      : 0;

    const statistics = {
      totalStudents,
      passedStudents,
      failedStudents,
      absentStudents,
      passCount: passedStudents,
      failCount: failedStudents,
      absentCount: absentStudents,
      avgMarks: Math.round(classAverage * 100) / 100,
      classAverage: Math.round(classAverage * 100) / 100,
      passPercentage: totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0
    };

    return NextResponse.json({
      data: processedData,
      statistics,
      subjectDetails: {
        name: subjectName,
        totalStudents: processedData.length,
        internalMax: subjectDetails.internal_maxMarks,
        externalMax: subjectDetails.external_maxMarks,
        internalMin: subjectDetails.internal_minMarks,
        externalMin: subjectDetails.external_minMarks
      }
    })

  } catch (error) {
    console.error('Error in subject marks API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
