import mongoose, { Schema, model, ObjectId } from "mongoose";
import { body, param } from "express-validator";


// 1. Create an interface representing a document in MongoDB.
interface IUser {
  _id:  mongoose.Types.ObjectId;
  userName: string;
  email: string;
  passordHash: string;
  likedComments?: ObjectId[];
  diLikedComments?: ObjectId[];
}

// 2. Create a Schema corresponding to the document interface.
const userSchema = new Schema<IUser>({
  _id: { type: Schema.Types.ObjectId, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  passordHash: { type: String, required: true },
  likedComments: { type: [Schema.Types.ObjectId], required: false, default: [] },
  diLikedComments: { type: [Schema.Types.ObjectId], required: false, default: [] },
});

// 3. Create a Model.
export const User = model<IUser>("User", userSchema);


userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.passwordHash
    delete returnedObject._id
    delete returnedObject.__v;
  }
})

export function newUser(userInfo : IUser){
  return new User(userInfo)
}


export const email = () =>
  body("email")
  .exists().withMessage("You need to supply an email")
  .isEmail().withMessage("Invalid Email")


export const password = () =>
  body("password")
  .exists().withMessage("You need to supply a password")
  .isStrongPassword({minLength: 8, minNumbers: 1, minUppercase: 1, minSymbols: 1})
  .withMessage("Passwords need to be 8 charaters long with at least 1 of each: numbers, uppercase and symbols")

export const username = () =>
  body("userName").exists().withMessage("username needs to be supplied")
