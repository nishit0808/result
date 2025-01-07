import connectDB from "../config/db";  // Import database connection
import Sessions from "../models/Sessions"; // Import the Sessions model
import Courses from "../models/Courses"; // Import the Courses model
connectDB(); // Connect to MongoDB

// POST: Create a new session
export async function POST(req) {
  try {
    // Get data from the request body
    const data = await req.json();
    console.log('Received session data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.course || !data.session || !Array.isArray(data.ssubjects)) {
      console.log('Missing required fields:', {
        course: !!data.course,
        session: !!data.session,
        ssubjects: Array.isArray(data.ssubjects)
      });
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

    // Debug subject data
    console.log('Validating subjects:', data.ssubjects);
    
    // Validate subject data
    for (const subject of data.ssubjects) {
      console.log('Checking subject:', subject);
      if (!subject.name || !subject.type || 
          typeof subject.internal_minMarks !== 'number' || 
          typeof subject.internal_maxMarks !== 'number' ||
          typeof subject.external_minMarks !== 'number' || 
          typeof subject.external_maxMarks !== 'number') {
        console.log('Invalid subject data found:', {
          name: !!subject.name,
          type: !!subject.type,
          internal_minMarks: typeof subject.internal_minMarks,
          internal_maxMarks: typeof subject.internal_maxMarks,
          external_minMarks: typeof subject.external_minMarks,
          external_maxMarks: typeof subject.external_maxMarks
        });
        return new Response(
          JSON.stringify({ 
            error: "Invalid subject data", 
            invalidSubject: subject,
            validationDetails: {
              name: !!subject.name,
              type: !!subject.type,
              internal_minMarks: typeof subject.internal_minMarks,
              internal_maxMarks: typeof subject.internal_maxMarks,
              external_minMarks: typeof subject.external_minMarks,
              external_maxMarks: typeof subject.external_maxMarks
            }
          }), 
          { status: 400 }
        );
      }
    }

    // Format the data for saving
    const formattedSubjects = data.ssubjects.map(subject => ({
      ...subject,
      internal_minMarks: Number(subject.internal_minMarks),
      internal_maxMarks: Number(subject.internal_maxMarks),
      external_minMarks: Number(subject.external_minMarks),
      external_maxMarks: Number(subject.external_maxMarks)
    }));

    console.log('Formatted subjects:', formattedSubjects);

    // Create the session with the provided data
    const sessionData = {
      course: data.course,
      semester: data.semester,
      session: data.session,
      ssubjects: formattedSubjects
    };

    console.log('Creating new session with data:', JSON.stringify(sessionData, null, 2));

    const newSession = new Sessions(sessionData);

    // Validate the session before saving
    const validationError = newSession.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ 
          error: "Session validation failed",
          details: validationError.message,
          validationErrors: Object.keys(validationError.errors).map(key => ({
            field: key,
            message: validationError.errors[key].message
          }))
        }), 
        { status: 400 }
      );
    }

    // Save the session to the database
    console.log('Attempting to save session...');
    const savedSession = await newSession.save();
    console.log('Session saved successfully:', savedSession);

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
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    
    // Return more detailed error message
    return new Response(
      JSON.stringify({ 
        error: "Failed to create session",
        errorType: error.name,
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

// GET: Fetch all sessions
export async function GET(req) {
  try {
    const sessions = await Sessions.find().populate('course');
    console.log('Fetched sessions:', sessions);
    return new Response(JSON.stringify(sessions), { status: 200 });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    return new Response(
      JSON.stringify({ error: "Failed to fetch sessions" }), 
      { status: 500 }
    );
  }
}
