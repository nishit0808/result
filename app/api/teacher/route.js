import { NextResponse } from "next/server"
import connectDB from "@/lib/mongoose"
import Teacher from "../models/Teacher"

export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { name, department, subjects } = body

    // Validate required fields
    if (!name || !department || !subjects || !subjects.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create or update teacher
    const teacher = await Teacher.findOneAndUpdate(
      { name, department },
      { subjects },
      { upsert: true, new: true }
    )

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error in POST /api/teacher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const name = searchParams.get('name')

    const query = {}
    if (department) query.department = department
    if (name) query.name = name

    const teachers = await Teacher.find(query)
    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error in GET /api/teacher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
