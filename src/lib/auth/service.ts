import mongoose from "mongoose";
import { connectToDatabase } from "../db/connect";
import { User } from "../db/models/user.model";
import type { UserDTO } from "@/lib/types/api";
import type { LoginBody, SignupBody } from "@/lib/schemas/auth";
import { hashPassword, verifyPassword } from "./password";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUserDTO(doc: any): UserDTO {
  return {
    id: String(doc._id),
    email: doc.email,
    ...(doc.name ? { name: doc.name } : {}),
  };
}

export async function signupUser(body: SignupBody): Promise<UserDTO> {
  await connectToDatabase();
  const email = body.email.toLowerCase().trim();
  const existing = await User.findOne({ email }).lean();
  if (existing) throw new Error("That email is already registered.");

  const passwordHash = await hashPassword(body.password);
  const name = body.name?.trim();
  const doc = await User.create({
    email,
    passwordHash,
    ...(name ? { name } : {}),
  });
  return toUserDTO(doc.toObject());
}

/** Returns the user on valid credentials, or null otherwise. */
export async function loginUser(body: LoginBody): Promise<UserDTO | null> {
  await connectToDatabase();
  const email = body.email.toLowerCase().trim();
  const doc = await User.findOne({ email });
  if (!doc) return null;
  const valid = await verifyPassword(body.password, doc.passwordHash);
  return valid ? toUserDTO(doc.toObject()) : null;
}

export async function getUserById(id: string): Promise<UserDTO | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectToDatabase();
  const doc = await User.findById(id).lean();
  return doc ? toUserDTO(doc) : null;
}
