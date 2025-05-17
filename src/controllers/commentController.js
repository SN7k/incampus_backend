const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Private
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ 
      post: req.params.postId,
      parent: null
    })
    .populate({
      path: 'user',
      select: 'name avatar'
    })
    .populate({
      path: 'replies',
      populate: {
        path: 'user',
        select: 'name avatar'
      }
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Create comment
    const comment = await Comment.create({
      content: req.body.content,
      post: req.params.postId,
      user: req.user.id,
      parent: req.body.parent || null
    });

    // Populate user info
    await comment.populate({
      path: 'user',
      select: 'name avatar'
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Make sure user is comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this comment'
      });
    }

    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'user',
      select: 'name avatar'
    });

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Make sure user is comment owner or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    // If this is a parent comment, delete all replies
    if (comment.parent === null) {
      await Comment.deleteMany({ parent: comment._id });
    }

    await comment.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Like a comment
// @route   PUT /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if the comment has already been liked by this user
    if (comment.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Comment already liked'
      });
    }

    // Add user id to likes array
    comment.likes.push(req.user.id);
    await comment.save();

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Unlike a comment
// @route   PUT /api/comments/:id/unlike
// @access  Private
exports.unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if the comment has not been liked by this user
    if (!comment.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Comment has not yet been liked'
      });
    }

    // Remove user id from likes array
    comment.likes = comment.likes.filter(
      like => like.toString() !== req.user.id.toString()
    );
    
    await comment.save();

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
