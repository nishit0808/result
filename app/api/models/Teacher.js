const mongoose = require('mongoose');

const subjectAssignmentSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
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
  subject: { 
    type: String, 
    required: true 
  }
});

const teacherSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  department: { 
    type: String, 
    required: true,
    enum: ['Computer Science', 'Science', 'Education', 'Commerce', 'Management', 'Art']
  },
  subjects: [subjectAssignmentSchema]
}, {
  timestamps: true
});

// Create a compound index on name and department to ensure uniqueness
teacherSchema.index({ name: 1, department: 1 }, { unique: true });

module.exports = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
