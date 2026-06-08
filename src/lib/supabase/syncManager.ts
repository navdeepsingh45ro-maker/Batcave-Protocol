/**
 * BATCAVE CLOUD SYNC MANAGER
 *
 * Syncs local backups to Supabase storage bucket "batcave-backups".
 * Requires Supabase configured with a Storage bucket named: batcave-backups
 *
 * Works as a hybrid:
 * - Local data is always the source of truth
 * - Cloud is used for cross-device restore and sharing
 */

import { getSupabaseClient, SUPABASE_CONFIGURED } from "./client";
import { buildBackupFile } from "@/lib/storage/manager";
import type { BatcaveUser } from "./auth";

const BUCKET = "batcave-backups";

export async function pushToCloud(user: BatcaveUser): Promise<{ ok: boolean; error?: string }> {
  if (!SUPABASE_CONFIGURED) return { ok: false, error: "Supabase not configured" };
  const client = await getSupabaseClient();
  if (!client) return { ok: false, error: "Client unavailable" };

  try {
    const backup = buildBackupFile("cloud-push");
    const json   = JSON.stringify(backup);
    const path   = `${user.id}/latest.json`;

    const { error } = await (client as any).storage
      .from(BUCKET)
      .upload(path, json, { contentType: "application/json", upsert: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function pullFromCloud(user: BatcaveUser): Promise<{ ok: boolean; raw?: string; error?: string }> {
  if (!SUPABASE_CONFIGURED) return { ok: false, error: "Supabase not configured" };
  const client = await getSupabaseClient();
  if (!client) return { ok: false, error: "Client unavailable" };

  try {
    const path = `${user.id}/latest.json`;
    const { data, error } = await (client as any).storage.from(BUCKET).download(path);
    if (error) return { ok: false, error: error.message };
    const raw = await (data as Blob).text();
    return { ok: true, raw };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function listCloudBackups(user: BatcaveUser): Promise<{ name: string; updatedAt: string }[]> {
  if (!SUPABASE_CONFIGURED) return [];
  const client = await getSupabaseClient();
  if (!client) return [];

  try {
    const { data } = await (client as any).storage.from(BUCKET).list(user.id);
    return (data ?? []).map((f: any) => ({ name: f.name, updatedAt: f.updated_at }));
  } catch {
    return [];
  }
}
