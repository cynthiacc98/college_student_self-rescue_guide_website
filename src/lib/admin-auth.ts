import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

/**
 * 管理后台权限验证助手
 * 验证用户是否已登录且具有ADMIN角色
 */
export async function requireAdminAuth(redirectPath: string = "/admin") {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(`/login?callbackUrl=${redirectPath}`);
  }
  
  if (session.user.role !== "ADMIN") {
    redirect(`/login?callbackUrl=${redirectPath}`);
  }
  
  return session;
}