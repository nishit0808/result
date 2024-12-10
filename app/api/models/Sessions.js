const mongoose = require('mongoose');

// Subject Schema
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Subject name
  internal_minMarks: { type: Number, required: true }, // Minimum internal marks
  internal_maxMarks: { type: Number, required: true }, // Maximum internal marks
  external_minMarks: { type: Number, required: true }, // Minimum external marks
  external_maxMarks: { type: Number, required: true }  // Maximum external marks
});

// Sessions Schema
const sessionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses', required: true }, // Reference to Courses schema
  session: { type: String, required: true }, // Academic session, e.g., "2023-2024"
  ssubjects: [subjectSchema] // Array of subjects for the session
});

module.exports = mongoose.models.Sessions || mongoose.model('Sessions', sessionSchema);
