const mongoose = require('mongoose');

// Subject Schema
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Subject name
  type: { 
    type: String, 
    required: true,
    enum: ['DSC', 'DSE', 'GE', 'AEC', 'SEC', 'VAC', 'XXX', 'None']
  }, // Subject type
  internal_minMarks: { type: Number, required: true }, // Minimum internal marks
  internal_maxMarks: { type: Number, required: true }, // Maximum internal marks
  external_minMarks: { type: Number, required: true }, // Minimum external marks
  external_maxMarks: { type: Number, required: true }  // Maximum external marks
});

// Sessions Schema
const sessionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses', required: true }, // Reference to Courses schema
  semester: { type: String, required: true }, // Semester, e.g., "Sem 1"
  session: { type: String, required: true }, // Academic session, e.g., "2023-2024"
  ssubjects: [subjectSchema] // Array of subjects for the session
});

// Clear the model if it's already registered
mongoose.models = {};

module.exports = mongoose.model('Sessions', sessionSchema);
