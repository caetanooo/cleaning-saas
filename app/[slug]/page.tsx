import { createServiceClient } from "@/lib/supabase";
import { rowToCleaner } from "@/app/api/cleaners/_shared";
import WizardClient from "./WizardClient";

export const dynamic = "force-dynamic";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  const isOwner = cleaner.email === "pedro.caetano.3anos@gmail.com";
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

  return <WizardClient cleaner={cleaner} />;
}
