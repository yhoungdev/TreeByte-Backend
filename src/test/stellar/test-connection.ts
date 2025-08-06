import { STELLAR_CONFIG } from "@/config/stellar-config";
import { stellarClientService, connectionManager } from "@/services/stellar";

(async () => {
  console.log("\n🔍 Horizon Connection Test");
  console.log("────────────────────────────");
  console.log(`🌐 Network: ${STELLAR_CONFIG.networkPassphrase}`);
  console.log(`🔗 Horizon URL: ${STELLAR_CONFIG.horizonURL}\n`);

  try {
    const server = stellarClientService.getServer();
    const ledgers = await server.ledgers().limit(1).call();
    const latest = ledgers.records[0].sequence;

    console.log("✅ Successfully connected to Stellar Horizon.");
    console.log(`📄 Latest ledger sequence: ${latest}\n`);

    // Test connection manager health check
    console.log("🔍 Testing connection manager...");
    const healthStatus = await connectionManager.checkServerHealth();
    for (const [serverName, isHealthy] of healthStatus) {
      console.log(`📡 ${serverName}: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    }

    // Test latency measurement
    const latency = await connectionManager.measureLatency();
    console.log(`⚡ Connection latency: ${latency}ms\n`);

    console.log("🚀 Horizon is operational!\n");
  } catch (err) {
    console.error("❌ ERROR: Could not connect to Horizon.\n");
    console.error(err);
    process.exit(1);
  }
})();
