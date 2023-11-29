import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import { body, param  } from "express-validator";

export enum ValidTopics {
  Politics = "Politics",
  Health = "Health",
  Sport = "Sport",
  Tech = "Tech",
}

// 1. Create an interface representing a document in MongoDB.
interface IPOST {
  _id: mongoose.Types.ObjectId;
  // Link to the owner account
  ownerId: mongoose.Types.ObjectId;

  // Prevent multiple database calls, keep username on record.
  userName: string;

  // parent ID is empty if the post is root post
  parentId?: mongoose.Types.ObjectId;
  // list of child posts, ie comments
  childIds?: mongoose.Types.ObjectId[];

  // actual content of the post
  content: string;

  // interactions with the post
  likes?: number;
  dislikes?: number;

  // Whether interaction is allowed on the post will be calculated on the fly
  created: Date;

  // multiple topics can be attributed to the post
  topics: ValidTopics[];
}

// 2. Create a Schema corresponding to the document interface.
const PostSchema = new Schema<IPOST>({
  _id: { type: Schema.Types.ObjectId, required: true },
  ownerId: { type: Schema.Types.ObjectId, required: true },
  userName: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, required: false, default: null },
  childIds: { type: [Schema.Types.ObjectId], required: false, default: [] },
  content: { type: String, required: true },
  likes: { type: Number, required: false, default: 0 },
  dislikes: { type: Number, required: false, default: 0 },
  created: { type: Date, required: true },
  topics: { type: [String], enum: Object.values(ValidTopics), required: true },
});

// 3. Create a Model.
export const Post = model<IPOST>("Post", PostSchema);


// === Validators related to Posts ===

// factory for type safety
export function createNewPost(data: IPOST) {
  return new Post(data);
}