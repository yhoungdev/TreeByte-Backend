import db from "@/lib/db/db";
import { uploadToIPFS } from "@/lib/ipfs/upload-to-ipfs";
import { sorobanDeploymentService } from "@/services/soroban-deployment.service";

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
  let ipfsResult;
  let contractDeployment;
  
  try {
    // 1. Upload metadata to IPFS
    ipfsResult = await uploadToIPFS(project);

    // 2. Deploy Soroban contract with project data
    contractDeployment = await sorobanDeploymentService.deployProjectToken({
      supply: project.supply,
      name: project.name,
      description: project.description,
      ipfsHash: ipfsResult.ipfsHash,
      issuerPublicKey: project.issuer_public_key,
    });

    // 3. Prepare complete object to insert into DB
    const projectWithMetadata = {
      ...project,
      ipfs_hash: ipfsResult.ipfsHash,
      ipfs_url: ipfsResult.ipfsUrl,
      contract_id: contractDeployment.contractAddress,
      transaction_hash: contractDeployment.transactionHash,
    };

    // 4. Insert into 'projects' table
    const { data, error } = await db
      .from("projects")
      .insert([projectWithMetadata])
      .select()
      .single();

    if (error) {
      console.error("Database insertion error:", error);
      throw new Error("Error inserting project into database");
    }

    return {
      ...data,
      contract_address: contractDeployment.contractAddress,
      issuer_public_key: contractDeployment.issuerPublicKey,
      transaction_hash: contractDeployment.transactionHash,
    };

  } catch (error) {
    console.error("Project registration failed:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Contract deployment failed")) {
        throw new Error(`Project registration failed: Contract deployment error - ${error.message}`);
      } else if (error.message.includes("Error inserting project into database")) {
        throw new Error(`Project registration failed: Database error - ${error.message}`);
      } else if (error.message.includes("IPFS")) {
        throw new Error(`Project registration failed: IPFS upload error - ${error.message}`);
      }
    }
    
    throw new Error(`Project registration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
