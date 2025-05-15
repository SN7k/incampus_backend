const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Post.countDocuments();

    // Query with pagination
    const posts = await Post.find()
      .populate({
        path: 'user',
        select: 'name avatar universityId'
      })
      .populate({
        path: 'comments',
        select: 'content user createdAt',
        options: { limit: 3 },
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination,
      data: posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get posts from friends
// @route   GET /api/posts/feed
// @access  Private
exports.getFeed = async (req, res) => {
  try {
    // Get current user with friends
    const user = await User.findById(req.user.id);
    
    // Include user's own posts and friends' posts
    const users = [...user.friends, req.user.id];

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Post.countDocuments({ user: { $in: users } });

    // Query with pagination
    const posts = await Post.find({ user: { $in: users } })
      .populate({
        path: 'user',
        select: 'name avatar universityId'
      })
      .populate({
        path: 'comments',
        select: 'content user createdAt',
        options: { limit: 3 },
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination,
      data: posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name avatar universityId'
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Validate content or media
    if (!req.body.content && (!req.body.media || req.body.media.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Please add content or media to your post'
      });
    }

    const post = await Post.create(req.body);

    // Return the newly created post with populated user
    const populatedPost = await Post.findById(post._id).populate({
      path: 'user',
      select: 'name avatar universityId'
    });

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Make sure user is post owner
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this post'
      });
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'user',
      select: 'name avatar universityId'
    });

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Make sure user is post owner
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    await post.remove();

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

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if the post has already been liked by this user
    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Post already liked'
      });
    }

    // Add user id to likes array
    post.likes.push(req.user.id);
    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Unlike a post
// @route   PUT /api/posts/:id/unlike
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if the post has not been liked by this user
    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'Post has not yet been liked'
      });
    }

    // Remove user id from likes array
    post.likes = post.likes.filter(
      like => like.toString() !== req.user.id.toString()
    );
    
    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get posts by user
// @route   GET /api/posts/user/:userId
// @access  Private
exports.getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Post.countDocuments({ user: req.params.userId });

    const posts = await Post.find({ user: req.params.userId })
      .populate({
        path: 'user',
        select: 'name avatar universityId'
      })
      .populate({
        path: 'comments',
        select: 'content user createdAt',
        options: { limit: 3 },
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination,
      data: posts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
