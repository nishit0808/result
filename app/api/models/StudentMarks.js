import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  internal_minMarks: { type: Number, required: true },
  internal_maxMarks: { type: Number, required: true },
  internal_obtainedMarks: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true,
    validate: {
      validator: function(v) {
        return v === 'A' || (typeof v === 'number' && v >= 0);
      },
      message: props => `${props.value} is not a valid marks value. Must be 'A' for absent or a non-negative number`
    }
  },
  external_minMarks: { type: Number, required: true },
  external_maxMarks: { type: Number, required: true },
  external_obtainedMarks: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true,
    validate: {
      validator: function(v) {
        return v === 'A' || (typeof v === 'number' && v >= 0);
      },
      message: props => `${props.value} is not a valid marks value. Must be 'A' for absent or a non-negative number`
    }
  }
});

const studentMarksSchema = new mongoose.Schema({
  student: {
    rollNo: { type: String, required: true },
    enrollmentNo: { type: String, required: true },
    name: { type: String, required: true }
  },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  semester: { type: String, required: true },
  session: { type: String, required: true },
  subjects: { 
    type: [marksSchema], 
    required: true,
    default: undefined
  },
  isWithheld: { type: Boolean, default: false }
}, { timestamps: true });

// Add methods for calculating derived fields
studentMarksSchema.methods.calculateTotalMarks = function() {
  if (!this.subjects || !this.subjects.length) return 0;
  return this.subjects.reduce((total, subject) => {
    const internal = subject.internal_obtainedMarks === 'A' ? 0 : subject.internal_obtainedMarks;
    const external = subject.external_obtainedMarks === 'A' ? 0 : subject.external_obtainedMarks;
    return total + internal + external;
  }, 0);
};

studentMarksSchema.methods.calculatePercentage = function() {
  if (!this.subjects || !this.subjects.length) return 0;
  const totalMaxMarks = this.subjects.reduce((total, subject) => {
    return total + subject.internal_maxMarks + subject.external_maxMarks;
  }, 0);
  return (this.calculateTotalMarks() / totalMaxMarks) * 100;
};

studentMarksSchema.methods.calculateResult = function() {
  if (!this.subjects || !this.subjects.length) return 'FAIL';
  
  // Check if student is absent in all subjects
  const allAbsent = this.subjects.every(subject => 
    subject.internal_obtainedMarks === 'A' && 
    subject.external_obtainedMarks === 'A'
  );
  if (allAbsent) return 'ABSENT';

  // Check if student is absent in any subject
  const anyAbsent = this.subjects.some(subject => 
    subject.internal_obtainedMarks === 'A' || 
    subject.external_obtainedMarks === 'A'
  );
  if (anyAbsent) return 'FAIL';

  // Check if student has failed in any subject
  const hasFailed = this.subjects.some(subject => {
    const internal = Number(subject.internal_obtainedMarks);
    const external = Number(subject.external_obtainedMarks);
    return internal < subject.internal_minMarks || 
           external < subject.external_minMarks;
  });

  return hasFailed ? 'FAIL' : 'PASS';
};

// Add virtual properties that use the methods
studentMarksSchema.virtual('totalMarks').get(function() {
  return this.calculateTotalMarks();
});

studentMarksSchema.virtual('percentage').get(function() {
  return this.calculatePercentage();
});

studentMarksSchema.virtual('result').get(function() {
  return this.calculateResult();
});

// Ensure virtuals are included in JSON output
studentMarksSchema.set('toJSON', { virtuals: true });
studentMarksSchema.set('toObject', { virtuals: true });

const StudentMarks = mongoose.models.StudentMarks || mongoose.model('StudentMarks', studentMarksSchema);

export default StudentMarks;
