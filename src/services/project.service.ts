// src/services/project.service.ts
import db from "@/lib/db/db";

type ProjectDTO = {
  name: string;
  description: string;
  location: string;
  photo_url: string;
  impact: string;
  asset_code: string;
  issuer_public_key: string; 
  supply: number;
};

export const registerProjectService = async (project: ProjectDTO) => {
  const { data, error } = await db.from("projects").insert([project]).select().single(); 

  if (error) {
    console.error(error);
    throw new Error("Error inserting project");
  }

  return data;
};
