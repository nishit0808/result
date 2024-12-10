import connectDB from "../config/db";
import Courses from "../models/Courses";

connectDB();

export async function POST(req) {
  try {
    const { name, semester } = await req.json();
    const newCourse = await Courses.create({ name, semester });
    return new Response(
      JSON.stringify({ message: "Course created successfully", course: newCourse }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error creating course", details: error.message }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const courses = await Courses.find();
    return new Response(JSON.stringify(courses), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching courses", details: error.message }),
      { status: 500 }
    );
  }
}
