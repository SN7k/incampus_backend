# InCampus Backend API

This is the backend API for the InCampus social media application. It provides endpoints for user authentication, post management, comments, friend requests, and file uploads.

## Technologies Used

- Node.js
- Express.js
- MongoDB Atlas
- Cloudinary (for image/video storage)
- JWT Authentication

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   NODE_ENV=development
   ```
4. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/avatar` - Update user avatar
- `PUT /api/users/cover` - Update user cover photo
- `POST /api/users/:id/friend-request` - Send friend request
- `POST /api/users/:id/accept-request` - Accept friend request
- `POST /api/users/:id/reject-request` - Reject friend request
- `DELETE /api/users/:id/friend` - Remove friend

### Posts

- `GET /api/posts` - Get all posts
- `GET /api/posts/feed` - Get posts from friends
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create a new post
- `PUT /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post
- `PUT /api/posts/:id/like` - Like a post
- `PUT /api/posts/:id/unlike` - Unlike a post
- `GET /api/posts/user/:userId` - Get posts by user

### Comments

- `GET /api/posts/:postId/comments` - Get comments for a post
- `POST /api/posts/:postId/comments` - Add comment to a post
- `PUT /api/comments/:id` - Update a comment
- `DELETE /api/comments/:id` - Delete a comment
- `PUT /api/comments/:id/like` - Like a comment
- `PUT /api/comments/:id/unlike` - Unlike a comment

### File Upload

- `POST /api/upload` - Upload image/video to Cloudinary
- `DELETE /api/upload` - Delete image/video from Cloudinary

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in the following format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Success Responses

Successful responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

For list endpoints, the response includes pagination information:

```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "next": { "page": 2, "limit": 10 },
    "prev": { "page": 1, "limit": 10 }
  },
  "data": [ ... ]
}
```
