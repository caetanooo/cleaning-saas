import { redirect } from "next/navigation";
import { createServiceClient, createServerComponentClient } from "@/lib/supabase";
import { rowToCleaner } from "@/app/api/cleaners/_shared";
import { getOwnerEmails } from "@/lib/owners";
import WizardClient, { type CustomerProfile } from "./WizardClient";

export const dynamic = "force-dynamic";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ── Auth guard ────────────────────────────────────────────────────────────
  const anonClient = await createServerComponentClient();
  const { data: { user } } = await anonClient.auth.getUser();

  if (!user) {
    redirect(`/customer/signup?redirectTo=/${slug}`);
  }

  // ── Cleaner lookup (service role — bypasses RLS) ──────────────────────────
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("cleaners")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Booking link not found.</p>
      </div>
    );
  }

  const cleaner = rowToCleaner(data);

  const isOwner = getOwnerEmails().includes(cleaner.email);
  const isInactive =
    !isOwner &&
    cleaner.subscriptionStatus !== "active" &&
    cleaner.subscriptionStatus !== "trialing";

  if (isInactive) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-2xl">🔒</p>
          <p className="font-bold text-slate-800">Link Unavailable</p>
          <p className="text-sm text-slate-500">
            This booking link is currently inactive. Please contact the
            professional.
          </p>
        </div>
      </div>
    );
  }

  // ── Customer profile (anon client — RLS ensures user sees only own row) ───
  const { data: profile } = await anonClient
    .from("customer_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName: string =
    (user.user_metadata?.name as string | undefined) ||
    (profile as CustomerProfile | null)?.name ||
    user.email ||
    "";

  return (
    <WizardClient
      cleaner={cleaner}
      customerId={user.id}
      customerProfile={(profile as CustomerProfile) ?? null}
      displayName={displayName}
    />
  );
}
