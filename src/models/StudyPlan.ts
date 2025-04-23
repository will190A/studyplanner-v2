import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  id: String,
  date: String,
  subject: String,
  description: String,
  duration: Number,
  completed: Boolean,
});

const studyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjects: [String],
  startDate: String,
  endDate: String,
  dailyHours: Number,
  tasks: [taskSchema],
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.models.StudyPlan || mongoose.model('StudyPlan', studyPlanSchema); 