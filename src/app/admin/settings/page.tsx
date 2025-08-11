export const dynamic = "force-dynamic";

import SettingsManager from "@/components/admin/SettingsManager";
import clientPromise from "@/lib/mongodb";
import { requireAdminAuth } from "@/lib/admin-auth";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
}

async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const settings = await db.collection("settings").findOne({ type: "system" });
    
    if (settings?.config) {
      return settings.config;
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }
  
  // Fallback to defaults
  const defaultSettings = {
    siteName: "大学生自救指南",
    siteDescription: "高质量学习资料分享与检索平台",
    allowRegistration: true,
    maintenanceMode: false
  };
  
  return defaultSettings;
}

export default async function SettingsPage() {
  await requireAdminAuth("/admin/settings");

  const settings = await getSystemSettings();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">系统设置</h1>
        <p className="text-muted-foreground">配置系统参数和功能选项</p>
      </div>

      <SettingsManager initialSettings={settings} />
    </div>
  );
}
