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

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export const registerProjectService = async (project: ProjectDTO) => {
  let ipfsResult;
  let contractDeployment;
  
  try {
    ipfsResult = await uploadToIPFS(project);

    contractDeployment = await sorobanDeploymentService.deployProjectToken({
      supply: project.supply,
      name: project.name,
      description: project.description,
      ipfsHash: ipfsResult.ipfsHash,
      issuerPublicKey: project.issuer_public_key,
    });

    const projectWithMetadata = {
      ...project,
      ipfs_hash: ipfsResult.ipfsHash,
      ipfs_url: ipfsResult.ipfsUrl,
      contract_id: contractDeployment.contractAddress,
      transaction_hash: contractDeployment.transactionHash,
    };

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

export const getProjectByIdService = async (id: string): Promise<ProjectDTO | null> => {
  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") { 
    console.error("Supabase fetch error:", error);
    throw new Error("Failed to fetch project.");
  }

  return data;
};


export const getAllProjectsService = async (): Promise<ProjectDTO[]> => {
  const { data, error } = await db
    .from("projects")
    .select("*");

  if (error) {
    console.error("Supabase fetch error:", error);
    throw new Error("Failed to fetch all projects.");
  }

  return data || [];
};

export const getPaginatedProjectsService = async (
  page: number,
  limit: number
): Promise<PaginatedResult<ProjectDTO>> => {
  const offset = (page - 1) * limit;

  const { count, error: countError } = await db
    .from("projects")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Supabase count error:", countError);
    throw new Error("Failed to count projects.");
  }

  const { data, error } = await db
    .from("projects")
    .select("*")
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Supabase paginated fetch error:", error);
    throw new Error("Failed to fetch paginated projects.");
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
  };
};