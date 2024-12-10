const mongoose = require('mongoose');

// Subject Marks Schema
const subjectMarksSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  internal_minMarks: { type: Number, required: true },
  internal_maxMarks: { type: Number, required: true },
  internal_obtainedMarks: { type: Number, required: true },
  external_minMarks: { type: Number, required: true },
  external_maxMarks: { type: Number, required: true },
  external_obtainedMarks: { type: Number, required: true },
  total: { type: Number, required: true }
});

// Student Marks Schema
const studentMarksSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Courses', 
    required: true 
  },
  semester: { 
    type: String, 
    required: true 
  },
  session: { 
    type: String, 
    required: true 
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassDetails.students',
    required: true
  },
  subjects: [subjectMarksSchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.StudentMarks || mongoose.model('StudentMarks', studentMarksSchema);
