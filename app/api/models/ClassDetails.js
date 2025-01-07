const mongoose = require('mongoose');

// Student Schema
const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  enrollmentNo: { type: String, required: true },
  name: { type: String, required: true }
});

// ClassDetails Schema
const classDetailsSchema = new mongoose.Schema({
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
  students: [studentSchema]
}, {
  timestamps: true
});

// Clear the model if it's already registered
mongoose.models = {};

module.exports = mongoose.model('ClassDetails', classDetailsSchema);
