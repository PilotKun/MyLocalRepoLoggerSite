import mongoose, { Schema, Document } from 'mongoose';

export interface IWatched extends Document {
  userId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  watchedAt: Date;
  rating: number | null;
}

const WatchedSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  watchedAt: { type: Date, default: Date.now },
  rating: { type: Number, min: 0, max: 10, default: null }
});

// Create a compound index to ensure a user can only mark a media item as watched once
WatchedSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

export default mongoose.model<IWatched>('Watched', WatchedSchema);