import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const settings = await db.collection("settings").findOne({ type: "system" });
    
    const defaultSettings = {
      siteName: "大学生自救指南",
      siteDescription: "高质量学习资料分享与检索平台",
      allowRegistration: true,
      maintenanceMode: false
    };

    return NextResponse.json({
      settings: settings?.config || defaultSettings
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate settings
    const validatedSettings = {
      siteName: typeof body.siteName === 'string' ? body.siteName : "大学生自救指南",
      siteDescription: typeof body.siteDescription === 'string' ? body.siteDescription : "",
      allowRegistration: Boolean(body.allowRegistration),
      maintenanceMode: Boolean(body.maintenanceMode)
    };

    const client = await clientPromise;
    const db = client.db();
    
    await db.collection("settings").updateOne(
      { type: "system" },
      {
        $set: {
          type: "system",
          config: validatedSettings,
          updatedAt: new Date(),
          updatedBy: session.user.id
        },
        $setOnInsert: {
          createdAt: new Date(),
          createdBy: session.user.id
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      settings: validatedSettings 
    });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
