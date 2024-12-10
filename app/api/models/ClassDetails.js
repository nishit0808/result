const mongoose = require('mongoose');

// Student Schema
const studentSchema = new mongoose.Schema({
  uid: { type: String, required: true },
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

module.exports = mongoose.models.ClassDetails || mongoose.model('ClassDetails', classDetailsSchema);
