import connectDB from "../config/db";
import ClassDetails from "../models/ClassDetails";
import Sessions from "../models/Sessions";
import Courses from "../models/Courses";

connectDB();

// POST: Create a new class
export async function POST(req) {
  try {
    // Get data from the request body
    const data = await req.json();
    console.log('Received class data:', data);

    // Validate required fields
    if (!data.course || !data.semester || !data.session || !Array.isArray(data.students)) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields", 
          received: {
            course: !!data.course,
            semester: !!data.semester,
            session: !!data.session,
            students: Array.isArray(data.students)
          }
        }), 
        { status: 400 }
      );
    }

    // Validate student data
    for (const student of data.students) {
      if (!student.rollNo || !student.enrollmentNo || !student.name) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid student data", 
            invalidStudent: student 
          }), 
          { status: 400 }
        );
      }
    }

    // Check for duplicate roll numbers or enrollment numbers
    const duplicateRollNos = data.students.filter(
      (student, index, self) =>
        self.findIndex(s => s.rollNo === student.rollNo) !== index
    );
    const duplicateEnrollmentNos = data.students.filter(
      (student, index, self) =>
        self.findIndex(s => s.enrollmentNo === student.enrollmentNo) !== index
    );

    if (duplicateRollNos.length > 0 || duplicateEnrollmentNos.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Duplicate student entries found", 
          duplicates: {
            rollNos: duplicateRollNos,
            enrollmentNos: duplicateEnrollmentNos
          }
        }), 
        { status: 400 }
      );
    }

    // Verify if the session exists
    const sessionExists = await Sessions.findOne({
      course: data.course,
      session: data.session
    });

    if (!sessionExists) {
      return new Response(
        JSON.stringify({ error: "Invalid session or course" }), 
        { status: 400 }
      );
    }

    // Create the class with the provided data
    const newClass = new ClassDetails({
      course: data.course,
      semester: data.semester,
      session: data.session,
      students: data.students
    });

    // Save the class to the database
    const savedClass = await newClass.save();
    console.log('Saved class:', savedClass);

    // Return a success response
    return new Response(
      JSON.stringify({ 
        message: "Class created successfully", 
        class: savedClass 
      }), 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating class:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create class",
        details: error.message,
        validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : undefined
      }), 
      { status: 500 }
    );
  }
}

// GET: Fetch all classes or filter by query params
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const course = searchParams.get('course');
    const semester = searchParams.get('semester');
    const session = searchParams.get('session');

    let query = {};
    if (course) query.course = course;
    if (semester) query.semester = semester;
    if (session) query.session = session;

    const classes = await ClassDetails.find(query).populate('course');
    return new Response(JSON.stringify(classes), { status: 200 });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch classes",
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}
