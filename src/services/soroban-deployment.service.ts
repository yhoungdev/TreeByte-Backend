import { execSync } from 'child_process';
import path from 'path';
import os from 'os';

export interface ContractDeploymentParams {
  supply: number;
  name: string;
  description: string;
  ipfsHash: string;
  issuerPublicKey: string;
}

export interface ContractDeploymentResult {
  contractAddress: string;
  issuerPublicKey: string;
  transactionHash: string;
}

export class SorobanDeploymentService {
  private contractPath: string;
  private sorobanCommand: string;

  constructor() {
    this.contractPath = path.join(process.cwd(), 'contracts', 'contracts', 'project-token');
    this.sorobanCommand = this.getSorobanCommand();
  }

  private getSorobanCommand(): string {
    const platform = os.platform();
    if (platform === 'win32') {
      return 'wsl -d Ubuntu -- bash -c "source ~/.bashrc && soroban"';
    }
    return 'soroban';
  }

  async deployProjectToken(params: ContractDeploymentParams): Promise<ContractDeploymentResult> {
    try {
      const contractWasmPath = await this.buildContract();
      const contractAddress = await this.deployContract(contractWasmPath);
      const transactionHash = await this.initializeContract(contractAddress, params);

      return {
        contractAddress,
        issuerPublicKey: params.issuerPublicKey,
        transactionHash,
      };
    } catch (error) {
      console.error('Contract deployment failed:', error);
      throw new Error(`Contract deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async buildContract(): Promise<string> {
    const platform = os.platform();
    let buildCommand: string;
    let wasmPath: string;
    
    if (platform === 'win32') {
      const wslContractPath = this.convertToWSLPath(this.contractPath);
      buildCommand = `wsl bash -c "cd '${wslContractPath}' && ~/.cargo/bin/cargo build --target wasm32-unknown-unknown --release"`;
      // WASM file is generated in the workspace target directory, not the individual contract directory
      wasmPath = path.join(process.cwd(), 'contracts', 'target', 'wasm32-unknown-unknown', 'release', 'project_token.wasm');
    } else {
      buildCommand = `cd "${this.contractPath}" && cargo build --target wasm32-unknown-unknown --release`;
      wasmPath = path.join(process.cwd(), 'contracts', 'target', 'wasm32-unknown-unknown', 'release', 'project_token.wasm');
    }
    
    try {
      console.log('Building contract with command:', buildCommand);
      execSync(buildCommand, { stdio: 'pipe' });
      console.log('Contract built successfully');
      return wasmPath;
    } catch (error: any) {
      const stderr = error.stderr ? error.stderr.toString() : '';
      const stdout = error.stdout ? error.stdout.toString() : '';
      console.error('Build command failed:', buildCommand);
      console.error('Error details:', error.message);
      console.error('Stderr:', stderr);
      console.error('Stdout:', stdout);
      throw new Error(`Failed to build contract: ${error.message}\nStderr: ${stderr}\nStdout: ${stdout}`);
    }
  }

  private convertToWSLPath(windowsPath: string): string {
    // Convert C:\path\to\file to /mnt/c/path/to/file
    return windowsPath.replace(/^([A-Z]):\\/, '/mnt/$1/').replace(/\\/g, '/').toLowerCase();
  }

  private async deployContract(wasmPath: string): Promise<string> {
    const platform = os.platform();
    let deployCommand: string;
    
    if (platform === 'win32') {
      const wslPath = this.convertToWSLPath(wasmPath);
      deployCommand = `wsl bash -c "~/.cargo/bin/soroban contract deploy --wasm '${wslPath}' --network testnet --source-account default"`;
    } else {
      deployCommand = `soroban contract deploy --wasm "${wasmPath}" --network testnet --source-account default`;
    }
    
    try {
      const result = execSync(deployCommand, { encoding: 'utf8', stdio: 'pipe' });
      return result.trim();
    } catch (error: any) {
      const stderr = error.stderr ? error.stderr.toString() : '';
      const stdout = error.stdout ? error.stdout.toString() : '';
      console.error('Deploy command failed:', deployCommand);
      console.error('Error details:', error.message);
      console.error('Stderr:', stderr);
      console.error('Stdout:', stdout);
      throw new Error(`Failed to deploy contract: ${error.message}\nStderr: ${stderr}\nStdout: ${stdout}`);
    }
  }

  private async initializeContract(
    contractAddress: string, 
    params: ContractDeploymentParams
  ): Promise<string> {
    const platform = os.platform();
    let initCommand: string;
    
    if (platform === 'win32') {
      initCommand = `wsl bash -c "~/.cargo/bin/soroban contract invoke --id '${contractAddress}' --network testnet --source-account default -- init --initial_supply ${params.supply} --project_name '${params.name}' --project_id '${params.description}' --ipfs_hash '${params.ipfsHash}' --issuer '${params.issuerPublicKey}'"`;
    } else {
      initCommand = `soroban contract invoke --id "${contractAddress}" --network testnet --source-account default -- init --initial_supply ${params.supply} --project_name "${params.name}" --project_id "${params.description}" --ipfs_hash "${params.ipfsHash}" --issuer "${params.issuerPublicKey}"`;
    }
    
    try {
      const result = execSync(initCommand, { encoding: 'utf8', stdio: 'pipe' });
      const txHashMatch = result.match(/Transaction hash: ([a-fA-F0-9]+)/);
      return txHashMatch ? txHashMatch[1] : 'unknown';
    } catch (error) {
      throw new Error(`Failed to initialize contract: ${error}`);
    }
  }
}

export const sorobanDeploymentService = new SorobanDeploymentService();