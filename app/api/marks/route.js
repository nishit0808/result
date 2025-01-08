import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import StudentMarks from '@/app/api/models/StudentMarks';

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    
    // Validate the request data
    if (!data.course || !data.semester || !data.session || !data.student || !data.subjects) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate marks data
    for (const subject of data.subjects) {
      // Skip validation for absent marks
      if (subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A') {
        continue;
      }

      // Validate numeric marks
      if (subject.internal_obtainedMarks > subject.internal_maxMarks ||
          subject.external_obtainedMarks > subject.external_maxMarks) {
        return NextResponse.json(
          { error: 'Obtained marks cannot exceed maximum marks' },
          { status: 400 }
        );
      }
    }

    // Create or update student marks
    const filter = {
      'student.rollNo': data.student.rollNo,
      course: data.course,
      semester: data.semester,
      session: data.session
    };

    const update = {
      student: data.student,
      subjects: data.subjects,
      isWithheld: data.isWithheld || false
    };

    const options = { 
      new: true, 
      upsert: true,
      runValidators: true 
    };

    const result = await StudentMarks.findOneAndUpdate(filter, update, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/marks:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    
    const course = searchParams.get('course');
    const semester = searchParams.get('semester');
    const session = searchParams.get('session');
    const rollNo = searchParams.get('rollNo');

    if (!course || !semester || !session) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }

    const query = {
      course,
      semester,
      session
    };

    if (rollNo) {
      query['student.rollNo'] = rollNo;
    }

    const marks = await StudentMarks.find(query)
      .populate('course', 'name')
      .sort({ 'student.rollNo': 1 });

    // Format marks for display
    const formattedMarks = marks.map(mark => ({
      ...mark.toObject(),
      subjects: mark.subjects.map(subject => ({
        ...subject,
        total: subject.internal_obtainedMarks === 'A' || subject.external_obtainedMarks === 'A' 
          ? 'AB' 
          : subject.internal_obtainedMarks + subject.external_obtainedMarks
      }))
    }));

    return NextResponse.json(formattedMarks);
  } catch (error) {
    console.error('Error in GET /api/marks:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
