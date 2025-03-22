import mongoose, { Schema, Document } from 'mongoose';

// Define the interface
interface IFavoriteDocument extends Document {
  userId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  addedAt: Date;
}

// Define the schema
const FavoriteSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  addedAt: { type: Date, default: Date.now }
});

// Create a compound index to ensure a user can only favorite a media item once
FavoriteSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

// Create the model
const FavoriteModel = mongoose.model<IFavoriteDocument>('Favorite', FavoriteSchema);

// Export both the model and interface
export type IFavorite = IFavoriteDocument;
export default FavoriteModel;