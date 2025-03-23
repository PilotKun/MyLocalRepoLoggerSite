import { db, connectToDatabase, closeDatabase } from './db';
import { users, mediaItems } from '../shared/schema';
import bcrypt from 'bcryptjs';
import { log } from './vite';

async function seed() {
  log('Starting database seeding...', 'seed');
  
  try {
    await connectToDatabase();
    
    // Add a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [user] = await db.insert(users).values({
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://avatar.vercel.sh/test',
      createdAt: new Date()
    }).returning();
    
    log(`Created test user: ${user.name} (ID: ${user.id})`, 'seed');
    
    // Add some sample media
    const sampleMedia = [
      {
        tmdbId: 299054,
        type: 'movie',
        title: 'Dune: Part Two',
        posterPath: '/vBZ0qvaRxqEhZwl6LWmruJqWE8Z.jpg',
        releaseDate: '2024-02-28',
        voteAverage: 84
      },
      {
        tmdbId: 1396,
        type: 'tv',
        title: 'Fallout',
        posterPath: '/bMUGhsGZ6ZPVWm0gGGvmrThBCmF.jpg',
        releaseDate: '2024-04-11',
        voteAverage: 81
      },
      {
        tmdbId: 956920,
        type: 'movie',
        title: 'Challengers',
        posterPath: '/cG5QZsiWrk9s2WmQrZoRCBTVjPL.jpg',
        releaseDate: '2024-04-25',
        voteAverage: 75
      }
    ];
    
    const media = await db.insert(mediaItems).values(sampleMedia).returning();
    log(`Added ${media.length} sample media items`, 'seed');
    
    log('Database seeding completed successfully!', 'seed');
  } catch (error) {
    log(`Error seeding database: ${error}`, 'seed');
  } finally {
    await closeDatabase();
  }
}

seed();