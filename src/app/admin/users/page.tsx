export const dynamic = "force-dynamic";

import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import SimpleUsersManager from "@/components/admin/SimpleUsersManager";
import { requireAdminAuth } from "@/lib/admin-auth";

interface User {
  _id: string;
  email: string;
  name?: string;
  role: "USER" | "ADMIN";
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

async function getUsers(): Promise<User[]> {
  const client = await clientPromise;
  const db = client.db();
  
  const users = await db.collection("users").find({})
    .sort({ createdAt: -1 })
    .toArray();
    
  // Convert ObjectIds to strings for client components
  return users.map(user => ({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
    isActive: user.isActive !== false
  })) as User[];
}

async function getUserStats() {
  const client = await clientPromise;
  const db = client.db();
  
  const [totalUsers, adminCount, userCount, activeUsers] = await Promise.all([
    db.collection("users").countDocuments({}),
    db.collection("users").countDocuments({ role: "ADMIN" }),
    db.collection("users").countDocuments({ role: "USER" }),
    db.collection("users").countDocuments({ isActive: { $ne: false } })
  ]);
  
  return { totalUsers, adminCount, userCount, activeUsers };
}

export default async function UsersPage() {
  await requireAdminAuth("/admin/users");
    
  return <SimpleUsersManager />;
}
