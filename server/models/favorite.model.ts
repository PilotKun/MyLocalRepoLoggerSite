import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  addedAt: Date;
}

const FavoriteSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  addedAt: { type: Date, default: Date.now }
});

// Create a compound index to ensure a user can only favorite a media item once
FavoriteSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

export default mongoose.model<IFavorite>('Favorite', FavoriteSchema);