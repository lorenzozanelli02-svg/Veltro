import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { adminConfigured, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-sm pt-8">
      <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <p className="mt-4 rounded-2xl bg-accent-soft p-4 text-sm text-accent-hover">
          The admin area is disabled. Set the <code className="font-mono">ADMIN_PASSWORD</code> environment variable and restart the server.
        </p>
      )}
    </div>
  );
}
