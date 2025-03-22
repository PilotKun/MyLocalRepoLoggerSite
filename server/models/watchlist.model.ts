import mongoose, { Schema, Document } from 'mongoose';

export interface IWatchlist extends Document {
  userId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  addedAt: Date;
}

const WatchlistSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  addedAt: { type: Date, default: Date.now }
});

// Create a compound index to ensure a user can only add a media item to their watchlist once
WatchlistSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

export default mongoose.model<IWatchlist>('Watchlist', WatchlistSchema);