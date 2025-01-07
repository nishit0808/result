import { NextResponse } from 'next/server';
import connectDB from '../../config/db';
import Courses from '../../models/Courses';
import ClassDetails from '../../models/ClassDetails';
import StudentMarks from '../../models/StudentMarks';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const courseId = params.id;

    // Fetch course details
    const course = await Courses.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Fetch related class details
    const classDetails = await ClassDetails.find({ course: courseId })
      .select('semester session students')
      .lean();

    // Get unique semesters and sessions
    const semesters = [...new Set(classDetails.map(c => c.semester))];
    const sessions = [...new Set(classDetails.map(c => c.session))];

    // Get total students count
    const totalStudents = classDetails.reduce((sum, cls) => sum + cls.students.length, 0);

    // Get student performance data
    const studentMarks = await StudentMarks.find({
      classDetails: { $in: classDetails.map(c => c._id) }
    }).select('marks totalMarks status');

    // Calculate performance metrics
    const performanceMetrics = {
      totalExams: studentMarks.length,
      passCount: studentMarks.filter(mark => mark.status === 'Pass').length,
      failCount: studentMarks.filter(mark => mark.status === 'Fail').length,
      averageScore: studentMarks.length > 0 
        ? (studentMarks.reduce((sum, mark) => sum + (mark.marks / mark.totalMarks * 100), 0) / studentMarks.length).toFixed(2)
        : 0
    };

    // Prepare the response
    const response = {
      courseDetails: {
        id: course._id,
        name: course.name,
        semesters: course.semester
      },
      statistics: {
        totalStudents,
        activeSemesters: semesters,
        sessions,
        performance: performanceMetrics
      },
      classDetails: classDetails.map(cls => ({
        semester: cls.semester,
        session: cls.session,
        studentCount: cls.students.length
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course details' },
      { status: 500 }
    );
  }
}
