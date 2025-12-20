import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  githubUsername: {
    type: String,
    trim: true
  },
  microsoftLearnEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  completedPages: [{
    type: Number
  }],
  lastViewedPage: {
    type: Number,
    default: 1
  },
  completedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;

