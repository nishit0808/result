const mongoose = require("mongoose");

// Schema for courses
const courseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Course name, e.g., "B.Tech CSE"
  semester: { type: [String], required: true }, // List of semesters, e.g., ["Sem 1", "Sem 2"]
});

// Export the model, reusing if already defined
module.exports = mongoose.models.Courses || mongoose.model("Courses", courseSchema);
