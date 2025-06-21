import Post from '../models/Post.js';
import Friend from '../models/Friend.js';
import Notification from '../models/Notification.js';
import cloudinary from '../config/cloudinary.js';
import { createLikeNotification } from '../services/notificationService.js';

// Create post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
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

    // Validate that either content or images are present
    if ((!content || content.trim() === '') && images.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Post must contain either content or media'
      });
    }

    const post = await Post.create({
      author,
      content: content ? content.trim() : '',
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

    // 1. Get user's friends
    const friendships = await Friend.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'accepted'
    });
    const friendIds = friendships.map(friendship =>
      friendship.sender.equals(userId) ? friendship.receiver : friendship.sender
    );

    // 2. Get posts from the user and their friends
    const friendsPosts = await Post.find({ author: { $in: [...friendIds, userId] } })
      .populate('author', 'name avatar universityId role')
      .sort('-createdAt')
      .limit(50) // Increased limit for a richer feed
      .lean(); // Use lean for better performance

    // 3. Get posts liked by friends
    const likedByFriendsPosts = await Post.find({
      likes: { $in: friendIds }, // Find posts liked by any of the user's friends
      author: { $nin: [...friendIds, userId] } // Exclude posts already authored by user/friends
    })
      .populate('author', 'name avatar universityId role')
      .populate({
        path: 'likes',
        select: 'name _id'
      })
      .sort('-createdAt')
      .limit(20)
      .lean();

    // 4. Add social context to posts liked by friends
    const postsWithSocialContext = likedByFriendsPosts.map(post => {
      // Find the first friend who liked this post
      const likingFriend = post.likes.find(like => friendIds.some(friendId => friendId.equals(like._id)));
      return {
        ...post,
        likedByFriend: likingFriend ? likingFriend.name : null // Add the name of the friend who liked it
      };
    });

    // 5. Combine, de-duplicate, and sort posts
    const allPosts = [...friendsPosts, ...postsWithSocialContext];
    
    const uniquePosts = Array.from(new Map(allPosts.map(post => [post._id.toString(), post])).values());

    // Sort by creation date in descending order
    uniquePosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Manually map _id to id for each post
    const finalPosts = uniquePosts.map(post => {
      post.id = post._id.toString();
      delete post._id;
      return post;
    });

    res.status(200).json({
      status: 'success',
      data: {
        posts: finalPosts.slice(0, 50) // Limit the final feed size
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
    const posts = await Post.find({ author: userId })
      .populate('author', 'name avatar universityId role')
      .populate('likes', 'name avatar universityId role');
    res.status(200).json({ status: 'success', data: { posts } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};