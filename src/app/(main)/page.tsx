
import HeroSection from '@/components/HeroSection'; 
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import UserDashboard from '@/components/dashboard/UserDashboard';
import { getUserStats } from "@/lib/stats";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (session && session.user) {
    const [statsResult, recentRaces] = await Promise.all([
      getUserStats(session.user.id),
      prisma.raceResult.findMany({
        where: { userId: session.user.id },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
    ]);

    const stats = {
      racesPlayed: statsResult.totalRaces,
      bestWpm: Math.round(statsResult.bestWpm),
      accuracy: statsResult.avgAccuracy,
      avgWpm: Math.round(statsResult.avgWpm),
      streak: 0,
    };

    const formatDate = (date: Date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    const formattedRecentRaces = recentRaces.map(race => ({
      id: race.id,
      wpm: Math.round(Number(race.wpm)),
      accuracy: Math.round(Number(race.accuracy)),
      errors: 0,
      raceType: race.mode || 'solo',
      completedAt: race.completedAt,
      formattedDate: formatDate(race.completedAt),
    }));

    return <UserDashboard user={session.user as any} stats={stats} recentRaces={formattedRecentRaces} />;
  }

  return (
    <div id="home-content">
      <HeroSection />
    </div>
  );
}