import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

type AttemptKind = "requirement" | "proposal";

type AttemptStatus = {
  requirementLocked: boolean;
  proposalLocked: boolean;
};

type AttemptRecord = AttemptStatus & {
  updatedAt: string;
};

type AttemptStore = Record<string, AttemptRecord>;

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "ip-attempts.json");

const isVercel = Boolean(process.env.VERCEL);
const redisRestUrl =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const redisRestToken =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasRemoteStore = Boolean(redisRestUrl && redisRestToken);

let storeQueue = Promise.resolve();
let warnedMissingRemoteStore = false;

function withStoreLock<T>(task: () => Promise<T>): Promise<T> {
  const next = storeQueue.then(task, task);
  storeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function warnRemoteStoreMissing() {
  if (warnedMissingRemoteStore || !isVercel || hasRemoteStore) return;
  warnedMissingRemoteStore = true;
  console.warn(
    "[ip-attempts] Remote storage is not configured on Vercel. Attempt locking is disabled. Configure KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN."
  );
}

function getAttemptKey(kind: AttemptKind, ip: string) {
  return `attempt:${kind}:${ip}`;
}

async function redisGet(key: string) {
  const res = await fetch(`${redisRestUrl}/get/${encodeURIComponent(key)}`, {
    headers: {
      Authorization: `Bearer ${redisRestToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`redis_get_failed:${res.status}`);
  }

  const data = await res.json();
  return data?.result ?? null;
}

async function redisSetNx(key: string, value: string) {
  const res = await fetch(
    `${redisRestUrl}/setnx/${encodeURIComponent(key)}/${encodeURIComponent(value)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisRestToken}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`redis_setnx_failed:${res.status}`);
  }

  const data = await res.json();
  return Number(data?.result || 0) === 1;
}

async function getAttemptStatusRemote(ip: string): Promise<AttemptStatus> {
  const [requirement, proposal] = await Promise.all([
    redisGet(getAttemptKey("requirement", ip)),
    redisGet(getAttemptKey("proposal", ip)),
  ]);

  return {
    requirementLocked: Boolean(requirement),
    proposalLocked: Boolean(proposal),
  };
}

async function claimAttemptRemote(ip: string, kind: AttemptKind) {
  const ok = await redisSetNx(getAttemptKey(kind, ip), "1");
  const status = await getAttemptStatusRemote(ip);

  return { ok, ip, status };
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, "{}", "utf8");
  }
}

async function readStore(): Promise<AttemptStore> {
  await ensureStoreFile();
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: AttemptStore) {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function getAttemptStatusLocal(ip: string): Promise<AttemptStatus> {
  return withStoreLock(async () => {
    const store = await readStore();
    const record = store[ip];

    return {
      requirementLocked: Boolean(record?.requirementLocked),
      proposalLocked: Boolean(record?.proposalLocked),
    };
  });
}

async function claimAttemptLocal(ip: string, kind: AttemptKind) {
  return withStoreLock(async () => {
    const store = await readStore();
    const current = store[ip] || {
      requirementLocked: false,
      proposalLocked: false,
      updatedAt: new Date().toISOString(),
    };

    const key = kind === "requirement" ? "requirementLocked" : "proposalLocked";
    const alreadyLocked = Boolean(current[key]);

    if (alreadyLocked) {
      return {
        ok: false as const,
        ip,
        status: {
          requirementLocked: Boolean(current.requirementLocked),
          proposalLocked: Boolean(current.proposalLocked),
        },
      };
    }

    const next: AttemptRecord = {
      ...current,
      [key]: true,
      updatedAt: new Date().toISOString(),
    };

    store[ip] = next;
    await writeStore(store);

    return {
      ok: true as const,
      ip,
      status: {
        requirementLocked: Boolean(next.requirementLocked),
        proposalLocked: Boolean(next.proposalLocked),
      },
    };
  });
}

function getDisabledStatus(): AttemptStatus {
  warnRemoteStoreMissing();
  return {
    requirementLocked: false,
    proposalLocked: false,
  };
}

export function getRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const realIp =
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-client-ip");

  return realIp?.trim() || "unknown-ip";
}

export async function getAttemptStatusByIp(ip: string): Promise<AttemptStatus> {
  if (hasRemoteStore) {
    return getAttemptStatusRemote(ip);
  }

  if (isVercel) {
    return getDisabledStatus();
  }

  return getAttemptStatusLocal(ip);
}

export async function getAttemptStatus(req: Request) {
  return getAttemptStatusByIp(getRequestIp(req));
}

export async function claimAttempt(req: Request, kind: AttemptKind) {
  const ip = getRequestIp(req);

  if (hasRemoteStore) {
    return claimAttemptRemote(ip, kind);
  }

  if (isVercel) {
    return {
      ok: true as const,
      ip,
      status: getDisabledStatus(),
    };
  }

  return claimAttemptLocal(ip, kind);
}
