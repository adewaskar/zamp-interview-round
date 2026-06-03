import mongoose, { InferSchemaType, Model, Schema } from "mongoose";
import { Collection, ModelName } from "./constants";

/** An application user. Auth is email + password (hashed with bcrypt). */
const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
  },
  { timestamps: true, collection: Collection.USER },
);

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDoc> =
  (mongoose.models[ModelName.USER] as Model<UserDoc>) ||
  mongoose.model<UserDoc>(ModelName.USER, UserSchema);

export default User;
