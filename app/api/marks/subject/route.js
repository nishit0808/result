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

      return {
        studentName: record.student?.name || 'Unknown',
        rollNo: record.student?.rollNo || 'Unknown',
        internalMarks: subjectMarks.internal_obtainedMarks,
        externalMarks: subjectMarks.external_obtainedMarks,
        totalMarks: subjectMarks.internal_obtainedMarks === 'A' || subjectMarks.external_obtainedMarks === 'A' 
          ? 'AB'
          : Number(subjectMarks.internal_obtainedMarks) + Number(subjectMarks.external_obtainedMarks),
        maxMarks: subjectMarks.internal_maxMarks + subjectMarks.external_maxMarks,
        result: subjectMarks.internal_obtainedMarks === 'A' || subjectMarks.external_obtainedMarks === 'A'
          ? 'ABSENT'
          : Number(subjectMarks.internal_obtainedMarks) >= subjectMarks.internal_minMarks &&
            Number(subjectMarks.external_obtainedMarks) >= subjectMarks.external_minMarks
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
      classAverage: Math.round(classAverage * 100) / 100,
      passPercentage: totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0
    };

    return NextResponse.json({
      data: processedData,
      statistics,
      subjectDetails: {
        name: subjectName,
        totalStudents: processedData.length
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
