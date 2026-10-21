import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { branchMetaTrackingConfigs } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import {
  parseMetaCtaEventName,
  type MetaCtaEventName,
} from "@/modules/tracking/meta-event";

export type BranchMetaTrackingMode = "inherit" | "custom" | "disabled";

type StoredConfig = {
  mode: string;
  pixelId: string | null;
  capiAccessTokenEncrypted: string | null;
  capiTestEventCodeEncrypted?: string | null;
  ctaMetaEvent: string | null;
};

export type BrowserMetaTrackingConfig = {
  pixelId: string | null;
  whatsappCtaMetaEvent: MetaCtaEventName | null;
};

export type ServerMetaTrackingConfig = BrowserMetaTrackingConfig & {
  capiAccessToken: string | null;
  capiTestEventCode?: string | null;
};

const reportedDecryptionFailures = new Set<string>();

export function whatsappCtaMetaEventForConfig(
  config: Pick<StoredConfig, "ctaMetaEvent"> | null,
): MetaCtaEventName {
  return config
    ? (parseMetaCtaEventName(config.ctaMetaEvent) ?? "Contact")
    : "Contact";
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

export function encryptedMetaCapiTokenMatches(
  encryptedValue: string | null,
  plaintextValue: string,
) {
  if (!encryptedValue || !plaintextValue) return false;
  try {
    return decryptMetaCapiToken(encryptedValue) === plaintextValue;
  } catch {
    return false;
  }
}

export function browserMetaTrackingConfig(
  config: Pick<StoredConfig, "mode" | "pixelId" | "ctaMetaEvent"> | null,
): BrowserMetaTrackingConfig {
  if (config?.mode === "disabled") {
    return { pixelId: null, whatsappCtaMetaEvent: null };
  }
  if (config?.mode === "custom") {
    return {
      pixelId: config.pixelId,
      whatsappCtaMetaEvent: whatsappCtaMetaEventForConfig(config),
    };
  }
  return {
    pixelId: serverEnv.NEXT_PUBLIC_META_PIXEL_ID ?? null,
    whatsappCtaMetaEvent: whatsappCtaMetaEventForConfig(config),
  };
}

export async function loadServerMetaTrackingConfig(
  branchId: string,
): Promise<ServerMetaTrackingConfig> {
  const [config] = await getDatabase()
    .select({
      mode: branchMetaTrackingConfigs.mode,
      pixelId: branchMetaTrackingConfigs.pixelId,
      capiAccessTokenEncrypted:
        branchMetaTrackingConfigs.capiAccessTokenEncrypted,
      capiTestEventCodeEncrypted:
        branchMetaTrackingConfigs.capiTestEventCodeEncrypted,
      ctaMetaEvent: branchMetaTrackingConfigs.ctaMetaEvent,
    })
    .from(branchMetaTrackingConfigs)
    .where(eq(branchMetaTrackingConfigs.branchId, branchId))
    .limit(1);

  const browser = browserMetaTrackingConfig(config ?? null);
  if (config?.mode === "disabled") {
    return {
      ...browser,
      capiAccessToken: null,
      capiTestEventCode: null,
    };
  }
  if (config?.mode !== "custom") {
    return {
      ...browser,
      capiAccessToken: serverEnv.META_CAPI_ACCESS_TOKEN ?? null,
      capiTestEventCode: config?.capiTestEventCodeEncrypted
        ? decryptMetaCapiToken(config.capiTestEventCodeEncrypted)
        : null,
    };
  }

  try {
    return {
      ...browser,
      capiAccessToken: config.capiAccessTokenEncrypted
        ? decryptMetaCapiToken(config.capiAccessTokenEncrypted)
        : null,
      capiTestEventCode: config.capiTestEventCodeEncrypted
        ? decryptMetaCapiToken(config.capiTestEventCodeEncrypted)
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
    return {
      ...browser,
      capiAccessToken: null,
      capiTestEventCode: null,
    };
  }
}
