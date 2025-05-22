# InCampus Backend API

This is the backend API for the InCampus social networking platform designed for college students and faculty.

## Features

- **Authentication System**
  - User registration and login
  - Email verification with OTP
  - Password reset functionality
  - JWT-based authentication

- **User Management**
  - Profile creation and updates
  - University ID verification
  - User search and discovery

- **Social Networking**
  - Friend request system
  - Post creation and management
  - Like and comment functionality
  - Profile interactions

- **Notification System**
  - Real-time notifications for social interactions
  - Friend request notifications
  - Post engagement notifications

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **Nodemailer** - Email services

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - Verify OTP for registration
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP

### User Profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile` - Update user profile
- `PUT /api/profile/password` - Change password
- `DELETE /api/profile` - Delete account

### Posts
- `GET /api/posts` - Get feed posts
- `GET /api/posts/:postId` - Get specific post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:postId` - Update post
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/like` - Like/unlike post
- `POST /api/posts/:postId/comment` - Add comment

### Friends
- `GET /api/friends` - Get friends list
- `GET /api/friends/requests` - Get friend requests
- `GET /api/friends/suggestions` - Get friend suggestions
- `POST /api/friends/request/:userId` - Send friend request
- `PUT /api/friends/accept/:userId` - Accept friend request
- `PUT /api/friends/decline/:userId` - Decline friend request
- `DELETE /api/friends/:userId` - Remove friend

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/SN7k/incampus_backend.git
cd incampus_backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/incampus
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
CLIENT_URL=http://localhost:5173
```

4. Start the development server
```bash
npm run dev
```

## Project Structure

```
incampus_backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── index.js         # Entry point
├── .env                 # Environment variables
├── .gitignore           # Git ignore file
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running in Production Mode
```bash
npm start
```

## API Documentation

For detailed API documentation, see the [API Documentation](https://documenter.getpostman.com/view/12345678/incampus-api/abcdefg).

## License

This project is licensed under the MIT License.

## Acknowledgments

- All contributors to the InCampus project
- The university community for feedback and suggestions
