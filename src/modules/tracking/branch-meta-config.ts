import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { branchMetaTrackingConfigs } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import {
  parseMetaStandardEventName,
  type MetaStandardEventName,
} from "@/modules/tracking/meta-event";

export type BranchMetaTrackingMode = "inherit" | "custom" | "disabled";

type StoredConfig = {
  mode: string;
  pixelId: string | null;
  datasetId: string | null;
  capiAccessTokenEncrypted: string | null;
  pageLoadMetaEvent: string | null;
};

export type BrowserMetaTrackingConfig = {
  pixelId: string | null;
  pageLoadMetaEvent: MetaStandardEventName | null;
};

export type ServerMetaTrackingConfig = BrowserMetaTrackingConfig & {
  datasetId: string | null;
  capiAccessToken: string | null;
};

const reportedDecryptionFailures = new Set<string>();

export function pageLoadMetaEventForConfig(
  config: Pick<StoredConfig, "pageLoadMetaEvent"> | null,
): MetaStandardEventName | null {
  return config
    ? parseMetaStandardEventName(config.pageLoadMetaEvent)
    : "PageView";
}

function encryptionKey() {
  const value = serverEnv.META_TRACKING_CONFIG_ENCRYPTION_KEY;
  if (!value)
    throw new Error("Meta branch credential encryption is not configured.");
  return Buffer.from(value, "hex");
}

export function encryptMetaCapiToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptMetaCapiToken(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue)
    throw new Error("Invalid encrypted Meta branch credential.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function isMetaCapiTokenDecryptable(value: string | null) {
  if (!value) return false;
  try {
    decryptMetaCapiToken(value);
    return true;
  } catch {
    return false;
  }
}

export function browserMetaTrackingConfig(
  config: Pick<StoredConfig, "mode" | "pixelId" | "pageLoadMetaEvent"> | null,
): BrowserMetaTrackingConfig {
  if (config?.mode === "disabled") {
    return { pixelId: null, pageLoadMetaEvent: null };
  }
  if (config?.mode === "custom") {
    return {
      pixelId: config.pixelId,
      pageLoadMetaEvent: parseMetaStandardEventName(config.pageLoadMetaEvent),
    };
  }
  return {
    pixelId: serverEnv.NEXT_PUBLIC_META_PIXEL_ID ?? null,
    pageLoadMetaEvent: pageLoadMetaEventForConfig(config),
  };
}

export async function loadServerMetaTrackingConfig(
  branchId: string,
): Promise<ServerMetaTrackingConfig> {
  const [config] = await getDatabase()
    .select({
      mode: branchMetaTrackingConfigs.mode,
      pixelId: branchMetaTrackingConfigs.pixelId,
      datasetId: branchMetaTrackingConfigs.datasetId,
      capiAccessTokenEncrypted:
        branchMetaTrackingConfigs.capiAccessTokenEncrypted,
      pageLoadMetaEvent: branchMetaTrackingConfigs.pageLoadMetaEvent,
    })
    .from(branchMetaTrackingConfigs)
    .where(eq(branchMetaTrackingConfigs.branchId, branchId))
    .limit(1);

  const browser = browserMetaTrackingConfig(config ?? null);
  if (config?.mode === "disabled") {
    return { ...browser, datasetId: null, capiAccessToken: null };
  }
  if (config?.mode !== "custom") {
    return {
      ...browser,
      datasetId: serverEnv.META_CAPI_DATASET_ID ?? null,
      capiAccessToken: serverEnv.META_CAPI_ACCESS_TOKEN ?? null,
    };
  }

  try {
    return {
      ...browser,
      datasetId: config.datasetId,
      capiAccessToken: config.capiAccessTokenEncrypted
        ? decryptMetaCapiToken(config.capiAccessTokenEncrypted)
        : null,
    };
  } catch {
    if (!reportedDecryptionFailures.has(branchId)) {
      reportedDecryptionFailures.add(branchId);
      console.error("Meta branch credential could not be decrypted", {
        branchId,
        provider: "meta_capi",
        category: "configuration",
      });
    }
    return { ...browser, datasetId: null, capiAccessToken: null };
  }
}
