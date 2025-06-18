import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: false,
    trim: true,
    maxlength: [2000, 'Post cannot be more than 2000 characters']
  },
  // For backward compatibility
  media: {
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    publicId: String
  },
  // New field for multiple images
  images: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    url: {
      type: String,
      required: function() {
        return this.type !== undefined;
      }
    },
    publicId: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
postSchema.index({ author: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;