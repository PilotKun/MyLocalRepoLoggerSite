import mongoose, { Schema, Document } from 'mongoose';

export interface IList extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
}

const ListSchema: Schema = new Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, default: null },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IList>('List', ListSchema);