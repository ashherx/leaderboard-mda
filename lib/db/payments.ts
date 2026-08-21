import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Payment, PaymentProvider } from "@/lib/db/types";

/**
 * Payments are a separate audit trail from listings on purpose: a listing's
 * bid_amount_cents is its *current* state (what rank it holds right now),
 * while payments is an append-only log of every charge attempt against it —
 * including past re-bids, failures, and refunds. Never delete or overwrite
 * a payment row; every status change is a new row or an update to `status`
 * on the existing one, driven by the provider's webhook.
 */

export async function createPendingPayment(
  listingId: string,
  amountCents: number,
  provider: PaymentProvider | (string & {}) = "manual"
): Promise<Payment> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({ listing_id: listingId, amount_cents: amountCents, provider, status: "pending" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function attachProviderPaymentId(paymentId: string, providerPaymentId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("payments")
    .update({ provider_payment_id: providerPaymentId })
    .eq("id", paymentId);
  if (error) throw error;
}

export async function markPaymentCompleted(providerPaymentId: string, provider: string): Promise<Payment | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("provider_payment_id", providerPaymentId)
    .eq("provider", provider)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Marks a specific payment row completed by its own id — for manual/admin-driven completions that have no provider webhook to key off of (see PaymentProvider's "manual"). */
export async function markPaymentCompletedById(paymentId: string, providerPaymentId: string): Promise<Payment> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ status: "completed", completed_at: new Date().toISOString(), provider_payment_id: providerPaymentId })
    .eq("id", paymentId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function markPaymentFailed(providerPaymentId: string, provider: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("provider_payment_id", providerPaymentId)
    .eq("provider", provider);
  if (error) throw error;
}

export async function sumCompletedPaymentsCents(): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("payments").select("amount_cents").eq("status", "completed");
  if (error) throw error;
  return data.reduce((sum, row) => sum + row.amount_cents, 0);
}
