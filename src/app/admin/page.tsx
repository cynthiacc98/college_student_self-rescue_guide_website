import EnhancedDashboard from "@/components/admin/EnhancedDashboard";
import { requireAdminAuth } from "@/lib/admin-auth";

export default async function AdminPage() {
  await requireAdminAuth("/admin");
    
  return <EnhancedDashboard />;
}
