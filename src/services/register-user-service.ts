import db from "@/lib/db/db";
import { generateKeypair } from "@/services/stellar.service";

type UserDTO = {
  email: string;
  auth_method: "email" | "google";
};

export const registerUserService = async (user: UserDTO) => {

  const keypair = generateKeypair();


  const userToInsert = {
    email: user.email,
    auth_method: user.auth_method,
    public_key: keypair.publicKey(),
  };

  const { data, error } = await db
    .from("users")
    .insert([userToInsert])
    .select()
    .single();

  if (error) {
    console.error(" Error inserting user into database:", error);
    throw new Error("Error inserting user into database");
  }

  return data; 
};
