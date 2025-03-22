import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia extends Document {
  tmdbId: number;
  type: string; // 'movie' or 'tv'
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}

const MediaSchema: Schema = new Schema({
  tmdbId: { type: Number, required: true },
  type: { type: String, required: true, enum: ['movie', 'tv'] },
  title: { type: String, required: true },
  posterPath: { type: String, default: null },
  releaseDate: { type: String, default: null },
  voteAverage: { type: Number, default: null }
});

// Create a compound index on tmdbId + type to make them unique together
MediaSchema.index({ tmdbId: 1, type: 1 }, { unique: true });

export default mongoose.model<IMedia>('Media', MediaSchema);