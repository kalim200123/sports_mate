import MatchDetailContent from "@/components/match/MatchDetailContent";
import MatchHeader from "@/components/match/MatchHeader";
import { MatchService } from "@/services/match.service";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const matchId = parseInt(id, 10);

  if (isNaN(matchId)) {
    notFound();
  }

  const match = await MatchService.getMatchById(matchId);

  if (!match) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-[#121212] font-sans pb-20">
      {/* 1. Header (Always visible) */}
      <MatchHeader match={match} />

      {/* 2. Content Area (Client Component for Mobile Tabs) */}
      <MatchDetailContent matchId={matchId} />
    </div>
  );
}
