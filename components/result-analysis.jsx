"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";
import axios from "axios";

export default function ResultAnalysis() {
  const [courses, setCourses] = useState([{ id: 1, name: "", semester: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAddCourse = () => {
    setCourses([...courses, { id: Date.now(), name: "", semester: "" }]);
  };

  const handleRemoveCourse = (id) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  const handleCourseChange = (id, field, value) => {
    setCourses(
      courses.map((course) =>
        course.id === id ? { ...course, [field]: value } : course
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAnalysisResult(null);

    try {
      // Send each course data to the backend
      for (const course of courses) {
        await axios.post("/api/course", {
          name: course.name,
          semester: course.semester.split(","),
        });
      }
      alert("Courses submitted successfully!");
      setAnalysisResult("Courses have been submitted.");
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert("Failed to submit courses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-blue-900 dark:to-blue-800 p-4">
      <div className="container mx-auto">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Result Analysis Input
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="space-y-2 p-4 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow space-y-2">
                      <Label htmlFor={`course-name-${course.id}`}>
                        Course Name
                      </Label>
                      <Input
                        id={`course-name-${course.id}`}
                        placeholder="e.g., BCA, BSc"
                        value={course.name}
                        onChange={(e) =>
                          handleCourseChange(course.id, "name", e.target.value)
                        }
                        className="w-full"
                        required
                      />
                    </div>
                    {courses.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveCourse(course.id)}
                        aria-label={`Remove ${course.name || "course"}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`course-semester-${course.id}`}>
                      Semester
                    </Label>
                    <Input
                      id={`course-semester-${course.id}`}
                      placeholder="e.g., Spring 2024,Fall 2024"
                      value={course.semester}
                      onChange={(e) =>
                        handleCourseChange(course.id, "semester", e.target.value)
                      }
                      className="w-full"
                      required
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddCourse}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Course
              </Button>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for Analysis"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisResult ? (
              <pre className="whitespace-pre-wrap break-words">
                {analysisResult}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Analysis results will be displayed here after submission.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
