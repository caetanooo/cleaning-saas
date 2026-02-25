import { redirect } from "next/navigation";

// Server-side redirect — no JavaScript, no loading screen, no Supabase call.
// Authenticated users land on /cleaner/login, which checks session and
// forwards them to /cleaner/setup automatically.
export default function HomePage() {
  redirect("/cleaner/login");
}
