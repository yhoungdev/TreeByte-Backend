import StellarSdk from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "@/config/stellar-config";

export const stellarServer = new StellarSdk.Server(STELLAR_CONFIG.horizonURL);
