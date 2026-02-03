import Consul from "consul";

const CONSUL_HOST = process.env.CONSUL_HOST;
const CONSUL_PORT = process.env.CONSUL_PORT ? parseInt(process.env.CONSUL_PORT, 10) : undefined;

if (!CONSUL_HOST || !CONSUL_PORT) {
  throw new Error("CONSUL_HOST and CONSUL_PORT must be defined in environment variables");
}

const CACHE_TTL = 60000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

let consulInstance: Consul | null = null;
const serviceCache = new Map<string, { address: string; timestamp: number }>();

function getConsul(): Consul {
  if (!consulInstance) {
    consulInstance = new Consul({ host: CONSUL_HOST, port: CONSUL_PORT });
  }
  return consulInstance;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function resolveService(serviceName: string): Promise<string> {
  const cached = serviceCache.get(serviceName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.address;
  }

  const consul = getConsul();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const services = await consul.health.service({
        service: serviceName,
        passing: true,
      });

      if (!services || services.length === 0) {
        throw new Error(`Service "${serviceName}" not found in Consul`);
      }

      const { Address, Port } = services[0].Service;
      const address = `${Address}:${Port}`;

      serviceCache.set(serviceName, { address, timestamp: Date.now() });
      return address;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        console.warn(
          `[Consul] Attempt ${attempt}/${MAX_RETRIES} failed for ${serviceName}, retrying in ${RETRY_DELAY_MS}ms...`
        );
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  console.error(`[Consul] Failed to resolve ${serviceName} after ${MAX_RETRIES} attempts:`, lastError);
  throw lastError;
}

export function clearServiceCache(): void {
  serviceCache.clear();
}

export async function isConsulHealthy(): Promise<boolean> {
  try {
    await getConsul().status.leader();
    return true;
  } catch {
    return false;
  }
}
