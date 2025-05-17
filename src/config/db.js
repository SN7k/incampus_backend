const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log(`MongoDB URI: ${process.env.MONGODB_URI ? '***URI exists***' : 'URI is missing!'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`); 
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connected to database: ${conn.connection.name}`);
    
    // Test database by counting users
    const User = mongoose.connection.model('User');
    if (User) {
      const userCount = await User.countDocuments();
      console.log(`Number of users in database: ${userCount}`);
    }
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Full error:', error);
    
    // Don't exit in development mode to allow debugging
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.error('Not exiting process due to development mode');
    }
  }
};

module.exports = connectDB;
