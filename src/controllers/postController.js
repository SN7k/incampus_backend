import Post from '../models/Post.js';
import Friend from '../models/Friend.js';
import Notification from '../models/Notification.js';
import cloudinary from '../config/cloudinary.js';
import { createLikeNotification, createCommentNotification } from '../services/notificationService.js';

// Create post
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const author = req.user._id;
    let images = [];

    // Handle multiple image uploads if present
    if (req.files && req.files.length > 0) {
      // Process each uploaded file
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'incampus/posts',
          resource_type: 'auto'
        });

        images.push({
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    // Handle single image upload for backward compatibility
    if (req.file && images.length === 0) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'incampus/posts',
        resource_type: 'auto'
      });

      images.push({
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: result.secure_url,
        publicId: result.public_id
      });
    }

    const post = await Post.create({
      author,
      content: text,
      images
    });

    // Populate author details
    await post.populate('author', 'name avatar universityId');

    res.status(201).json({
      status: 'success',
      data: {
        post
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get user feed (friends' posts)
export const getFeed = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's friends
    const friendships = await Friend.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      status: 'accepted'
    });

    const friendIds = friendships.map(friendship => 
      friendship.sender.toString() === userId.toString()
        ? friendship.receiver
        : friendship.sender
    );

    // Add user's own ID to see their posts too
    friendIds.push(userId);

    // Get posts from friends
    const posts = await Post.find({
      author: { $in: friendIds }
    })
    .populate('author', 'name avatar')
    .populate('comments.user', 'name avatar')
    .sort('-createdAt')
    .limit(20);

    res.status(200).json({
      status: 'success',
      data: {
        posts
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Like/Unlike post
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('author', '_id');
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
      // Notify post author if not self
      if (post.author._id.toString() !== userId.toString()) {
        await createLikeNotification(post._id, userId, post.author._id);
      }
    }

    await post.save();

    res.status(200).json({
      status: 'success',
      data: {
        likes: post.likes.length,
        isLiked: !isLiked
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('author', '_id');
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    post.comments.push({
      user: userId,
      text
    });

    await post.save();

    // Populate the new comment's user details
    await post.populate('comments.user', 'name avatar');

    const newComment = post.comments[post.comments.length - 1];

    // Notify post author if not self
    if (post.author._id.toString() !== userId.toString()) {
      await createCommentNotification(post._id, newComment._id, userId, post.author._id);
    }

    res.status(201).json({
      status: 'success',
      data: {
        comment: newComment
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get post comments
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('comments.user', 'name avatar');

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        comments: post.comments
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this post'
      });
    }

    // Delete media from Cloudinary if exists (for backward compatibility)
    if (post.media && post.media.publicId) {
      await cloudinary.uploader.destroy(post.media.publicId);
    }
    
    // Delete all images from Cloudinary if they exist
    if (post.images && post.images.length > 0) {
      const deletePromises = post.images.map(image => {
        if (image.publicId) {
          return cloudinary.uploader.destroy(image.publicId);
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
    }

    // Delete notifications related to this post
    await Notification.deleteMany({ post: postId });
    
    // Delete the post
    await post.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get posts by a specific user
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId }).populate('author', 'name avatar');
    res.status(200).json({ status: 'success', data: { posts } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};