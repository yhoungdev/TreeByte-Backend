import pinataSDK from "@pinata/sdk";

const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY!,
});

export const uploadToIPFS = async (metadata: object) => {
  try {
    const result = await pinata.pinJSONToIPFS(metadata);
    return {
      ipfsHash: result.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    };
  } catch (err) {
    console.error("IPFS upload error:", err);
    throw new Error("Failed to upload metadata to IPFS");
  }
};
