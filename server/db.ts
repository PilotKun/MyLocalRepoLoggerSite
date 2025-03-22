import mongoose from 'mongoose';

// MongoDB connection - Uses the DATABASE_URL if available
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/cinelog';

// Connection function
export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Use appropriate options for Replit environment
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Export the mongoose connection for use elsewhere in the app
export const db = mongoose.connection;
