import "server-only";

import { promises as fs } from "fs";
import { PersonalMessage } from "@/types/config";
import { tenantDataPath } from "@/lib/tenant";

/**
 * Load the personal message for a tenant from
 * `data/tenants/{tenantId}/personal-message.json`.
 */
export async function getPersonalMessage(
  tenantId: string,
): Promise<PersonalMessage> {
  const filePath = tenantDataPath(tenantId, "personal-message.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as PersonalMessage;
}

/**
 * Load the site keywords for a tenant from
 * `data/tenants/{tenantId}/tags.json`.
 */
export async function getSiteKeywords(
  tenantId: string,
): Promise<string[]> {
  const filePath = tenantDataPath(tenantId, "tags.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw) as { siteKeywords: string[] };
  return data.siteKeywords;
}
