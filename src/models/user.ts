import { Schema, model, ObjectId } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
interface IUser {
  _id: ObjectId;
  userName: string;
  email: string;
  likedComments: ObjectId[];
  diLikedComments: ObjectId[];
}

// 2. Create a Schema corresponding to the document interface.
const userSchema = new Schema<IUser>({
  _id: { type: Schema.Types.ObjectId, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  likedComments: { type: [Schema.Types.ObjectId], required: false, default: [] },
  diLikedComments: { type: [Schema.Types.ObjectId], required: false, default: [] },
});

// 3. Create a Model.
export const User = model<IUser>("User", userSchema);
