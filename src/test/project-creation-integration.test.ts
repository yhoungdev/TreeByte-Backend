import { sorobanDeploymentService } from '@/services/soroban-deployment.service';

const testContractParams = {
  supply: 1000000,
  name: "Test Environmental Project",
  description: "A test project for environmental conservation",
  ipfsHash: "QmNwHbrLFTnW6xGpL4rUq68pk9dsCw5p9s5bGDgVqX3Ro7",
  issuerPublicKey: "GDYGGH463VTISV3QKRKYS3EP3AOBVGSLXOYHW7BF7GMWVEMAPE6A35GG",
};

async function testProjectCreationWithSoroban() {
  try {
    console.log('Testing Soroban contract deployment...');
    
    const result = await sorobanDeploymentService.deployProjectToken(testContractParams);
    
    console.log('Contract deployed and initialized successfully:');
    console.log('- Contract Address:', result.contractAddress);
    console.log('- Issuer Public Key:', result.issuerPublicKey);
    console.log('- Transaction Hash:', result.transactionHash);
    
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

if (require.main === module) {
  testProjectCreationWithSoroban()
    .then(() => {
      console.log('Integration test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Integration test failed:', error);
      process.exit(1);
    });
}