"use server";

import { createAdminClient } from "../shared/supabase-admin";
import type { BlockedPeriod, BlockedPeriodInput } from "./types";

interface BlockedPeriodRow {
  id: string;
  dentist_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  dentists: { first_name: string; last_name: string } | null;
}

const SELECT = "id, dentist_id, starts_at, ends_at, reason, dentists(first_name, last_name)";

function toBlockedPeriod(row: BlockedPeriodRow): BlockedPeriod {
  return {
    id: row.id,
    dentistId: row.dentist_id,
    dentistName: row.dentists ? `${row.dentists.first_name} ${row.dentists.last_name}` : "—",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
  };
}

export async function listBlockedPeriods(practiceId: string): Promise<BlockedPeriod[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blocked_periods")
    .select(SELECT)
    .eq("practice_id", practiceId)
    .order("starts_at", { ascending: false });
  if (error) throw new Error(`listBlockedPeriods failed: ${error.message}`);
  return ((data ?? []) as unknown as BlockedPeriodRow[]).map(toBlockedPeriod);
}

export async function createBlockedPeriod(practiceId: string, input: BlockedPeriodInput): Promise<BlockedPeriod> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blocked_periods")
    .insert({
      practice_id: practiceId,
      dentist_id: input.dentistId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      reason: input.reason || null,
    })
    .select(SELECT)
    .single<BlockedPeriodRow>();
  if (error) throw new Error(`createBlockedPeriod failed: ${error.message}`);
  return toBlockedPeriod(data);
}

export async function deleteBlockedPeriod(blockedPeriodId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("blocked_periods").delete().eq("id", blockedPeriodId);
  if (error) throw new Error(`deleteBlockedPeriod failed: ${error.message}`);
}
