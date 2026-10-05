import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <>
      <AdminNav />
      <div className="pt-6">{children}</div>
    </>
  );
}
