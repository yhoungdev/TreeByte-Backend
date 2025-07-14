import db from "@/lib/db/db";
import { uploadToIPFS } from "@/lib/ipfs/upload-to-ipfs";

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

// Simulated contract_id (for now, it's hardcoded)
const SIMULATED_CONTRACT_ID = "CB1234567890SIMULATEDCONTRACTIDEXAMPLE";

export const registerProjectService = async (project: ProjectDTO) => {
  // 1. Upload metadata to IPFS
  const ipfsResult = await uploadToIPFS(project);

  // 2. Prepare complete object to insert into DB
  const projectWithMetadata = {
    ...project,
    ipfs_hash: ipfsResult.ipfsHash,
    ipfs_url: ipfsResult.ipfsUrl,
    contract_id: SIMULATED_CONTRACT_ID,
  };

  // 3. Insert into 'projects' table
  const { data, error } = await db
    .from("projects")
    .insert([projectWithMetadata])
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Error inserting project into database");
  }

  return data;
};
