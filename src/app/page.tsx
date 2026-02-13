import { redirect } from "next/navigation";

// Minimal fallback — the next-intl middleware handles root redirect with
// accept-language negotiation and cookie detection. This page should
// never be reached in normal operation.
export default function RootPage() {
  redirect("/en");
}
