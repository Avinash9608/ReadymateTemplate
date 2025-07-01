import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name?: string;
  isAdmin?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserModel = models.User || model<IUser>('User', UserSchema);

export default UserModel; 