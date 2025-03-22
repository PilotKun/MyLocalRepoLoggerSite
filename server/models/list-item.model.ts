import mongoose, { Schema, Document } from 'mongoose';

export interface IListItem extends Document {
  listId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  addedAt: Date;
}

const ListItemSchema: Schema = new Schema({
  listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  addedAt: { type: Date, default: Date.now }
});

// Create a compound index to make listId + mediaId combinations unique
ListItemSchema.index({ listId: 1, mediaId: 1 }, { unique: true });

export default mongoose.model<IListItem>('ListItem', ListItemSchema);