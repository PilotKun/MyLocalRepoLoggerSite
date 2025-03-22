import mongoose from 'mongoose';

// MongoDB connection
// For Replit, we'll create a MongoDB connection string from the PostgreSQL connection info
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinelog';

// If MONGODB_URI is not set but we have PostgreSQL DATABASE_URL environment variables, 
// we'll create a MongoDB URI using these credentials
if (!process.env.MONGODB_URI && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGHOST) {
  // Create MongoDB Atlas style connection string using PostgreSQL credentials
  MONGODB_URI = `mongodb+srv://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/cinelog?retryWrites=true&w=majority`;
  console.log('Created MongoDB connection string from PostgreSQL credentials');
}

// Connection function
export async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't throw the error, let the app continue with in-memory storage
    console.log('Falling back to in-memory storage');
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
