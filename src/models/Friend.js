import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique friend relationships
friendSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
friendSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Transform MongoDB documents to include id field
friendSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Friend = mongoose.model('Friend', friendSchema);

export default Friend; 