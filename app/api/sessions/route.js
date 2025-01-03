import connectDB from "../config/db";  // Import database connection
import Sessions from "../models/Sessions"; // Import the Sessions model
import Courses from "../models/Courses"; // Import the Courses model
connectDB(); // Connect to MongoDB

// POST: Create a new session
export async function POST(req) {
  try {
    // Get data from the request body
    const data = await req.json();
    console.log('Received data:', data);

    // Validate required fields
    if (!data.course || !data.session || !Array.isArray(data.ssubjects)) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields", 
          received: {
            course: !!data.course,
            session: !!data.session,
            ssubjects: Array.isArray(data.ssubjects)
          }
        }), 
        { status: 400 }
      );
    }

    // Create the session with the provided data
    const newSession = new Sessions({
      course: data.course,
      semester: data.semester,
      session: data.session,
      ssubjects: data.ssubjects
    });

    // Save the session to the database
    const savedSession = await newSession.save();
    console.log('Saved session:', savedSession);

    // Return a success response
    return new Response(
      JSON.stringify({ 
        message: "Session created successfully", 
        session: savedSession 
      }), 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error creating session", 
        details: error.message,
        stack: error.stack 
      }), 
      { status: 500 }
    );
  }
}

// GET: Fetch all sessions
export async function GET( req ) {
  const { searchParams } = new URL(req.url);

  // Extract the 'id' query parameter
  const session = searchParams.get('session');
  const course = searchParams.get('course');
  const semester = searchParams.get('semester');
  // console.log('Received id:', session, course, semester);


  try {
    if (!session || !course || !semester) {
      // If no query params, return all sessions with course data populated
      const sessions = await Sessions.find().populate('course');
      return new Response(JSON.stringify(sessions), { status: 200 });
    } else {
      // Use aggregation to filter by course name, session, and semester
      const sessions = await Sessions.aggregate([
        {
          $lookup: {
            from: 'courses', // Name of the Courses collection
            localField: 'course',
            foreignField: '_id',
            as: 'courseDetails',
          },
        },
        { $unwind: '$courseDetails' }, // Deconstruct the courseDetails array
        {
          $match: {
            'courseDetails.name': course, // Match course name
            session: session,            // Match session
            semester: semester,          // Match semester
          },
        },
      ]);

      return new Response(JSON.stringify(sessions), { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching sessions", details: error.message }),
      { status: 500 }
    );
  }
}
