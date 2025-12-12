import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  // Get the user's preferred locale from cookies, default to 'en'
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  // Redirect to the localized home page
  redirect(`/${locale}`);
}
