export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";
import FavoritesClient from "@/components/FavoritesClient";

interface FavoriteResource {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  category?: {
    name: string;
    slug: string;
  } | null;
  _count?: {
    clicks?: number;    // 下载次数
    views?: number;     // 浏览次数
    favorites?: number; // 收藏次数
  };
  updatedAt: string;
  favoritedAt: string; // 收藏时间
}

async function getFavoriteResources(userId: string): Promise<FavoriteResource[]> {
  try {
    const client = await clientPromise;
    const db = client.db();

    // 获取用户收藏的资源ID
    const favorites = await db.collection("UserFavorites").find({
      userId: userId
    }).sort({ createdAt: -1 }).toArray();

    if (favorites.length === 0) {
      return [];
    }

    const resourceIds = favorites.map(f => f.resourceId);
    
    // 获取对应的资源详情
    const resources = await prisma.resource.findMany({
      where: {
        id: { in: resourceIds },
        isPublic: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        coverImageUrl: true,
        tags: true,
        updatedAt: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    // 获取每个资源的统计数据
    const statsPromises = resources.map(async (resource) => {
      const stats = await db.collection("ResourceStat").findOne({
        resourceId: resource.id
      });

      const favoriteCount = await db.collection("UserFavorites").countDocuments({
        resourceId: resource.id
      });

      const favorite = favorites.find(f => f.resourceId === resource.id);

      return {
        ...resource,
        updatedAt: resource.updatedAt.toISOString(),
        favoritedAt: favorite?.createdAt?.toISOString() || new Date().toISOString(),
        _count: {
          clicks: stats?.downloads || 0,
          views: stats?.views || 0,
          favorites: favoriteCount
        }
      };
    });

    const resourcesWithStats = await Promise.all(statsPromises);

    // 按收藏时间排序（最新收藏的在前面）
    return resourcesWithStats.sort((a, b) => 
      new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime()
    );

  } catch (error) {
    console.error("获取收藏资源失败:", error);
    return [];
  }
}

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/favorites");
  }

  const favoriteResources = await getFavoriteResources(session.user.id);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-4">
            <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
            <span className="text-white/70 text-sm">个人收藏</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold brand-text-gradient mb-4">
            我的收藏
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            已收藏 {favoriteResources.length} 个学习资源
          </p>
        </div>

        <FavoritesClient initialResources={favoriteResources} />
      </div>
    </div>
  );
}