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

let storeQueue = Promise.resolve();

function withStoreLock<T>(task: () => Promise<T>): Promise<T> {
  const next = storeQueue.then(task, task);
  storeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
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
  return withStoreLock(async () => {
    const store = await readStore();
    const record = store[ip];

    return {
      requirementLocked: Boolean(record?.requirementLocked),
      proposalLocked: Boolean(record?.proposalLocked),
    };
  });
}

export async function getAttemptStatus(req: Request) {
  return getAttemptStatusByIp(getRequestIp(req));
}

export async function claimAttempt(req: Request, kind: AttemptKind) {
  const ip = getRequestIp(req);

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
