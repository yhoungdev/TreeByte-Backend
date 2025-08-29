import db from "@/lib/db/db";
import { uploadToIPFS } from "@/lib/ipfs/upload-to-ipfs";
import { sorobanDeploymentService } from "@/services/soroban-deployment.service";
import { ProjectRepository } from '@/repositories/project.repository';
import type { Project } from '@/types/database';

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

const projectRepository = new ProjectRepository();

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

    const created = await projectRepository.create(projectWithMetadata as unknown as Partial<Project>);
    if (!created) {
      throw new Error("Error inserting project into database");
    }

    return {
      ...created,
      contract_address: contractDeployment.contractAddress,
      issuer_public_key: contractDeployment.issuerPublicKey,
      transaction_hash: contractDeployment.transactionHash,
    } as any;

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
  return (await projectRepository.findById(id)) as unknown as ProjectDTO | null;
};


export const getAllProjectsService = async (): Promise<ProjectDTO[]> => {
  const projects = await projectRepository.findMany();
  return (projects || []) as unknown as ProjectDTO[];
};

export const getPaginatedProjectsService = async (
  page: number,
  limit: number
): Promise<PaginatedResult<ProjectDTO>> => {
  const { data, total } = await projectRepository.paginateProjects(page, limit);
  return { data: data as unknown as ProjectDTO[], total, page, limit };
};