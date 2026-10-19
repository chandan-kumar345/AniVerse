import { PrismaClient } from '@prisma/client';
import { extractCleanEmbedFromWebPage } from '../services/videoExtractor.service';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Episode Cleanup & Embed Normalization ---');

  const allAnime = await prisma.anime.findMany({
    include: {
      episodes: {
        orderBy: { episodeNumber: 'asc' }
      }
    }
  });

  console.log(`Found ${allAnime.length} total anime in database.`);

  let cleanedAnimeCount = 0;
  let deletedEpisodesCount = 0;
  let extractedUrlsCount = 0;

  for (const anime of allAnime) {
    const eps = anime.episodes;
    if (eps.length === 0) continue;

    const realEps = eps.filter(e => e.videoUrl && e.videoUrl.trim().length > 0 && !e.videoUrl.includes('BigBuckBunny'));
    
    let toDeleteIds: string[] = [];

    if (realEps.length > 0) {
      // Keep only real episodes! Any episode with empty videoUrl is dummy padding.
      toDeleteIds = eps.filter(e => !e.videoUrl || e.videoUrl.trim() === '').map(e => e.id);
    } else {
      // Anime has no real video URLs at all: keep Episode 1, delete dummy episodes 2..12
      toDeleteIds = eps.filter(e => e.episodeNumber > 1 && (!e.videoUrl || e.videoUrl.trim() === '')).map(e => e.id);
    }

    if (toDeleteIds.length > 0) {
      await prisma.episode.deleteMany({
        where: {
          id: { in: toDeleteIds }
        }
      });
      deletedEpisodesCount += toDeleteIds.length;
      cleanedAnimeCount++;
    }

    // Now check for any episode with videoUrl that can be extracted to a clean player
    const remainingEps = await prisma.episode.findMany({
      where: { animeId: anime.id },
      orderBy: { episodeNumber: 'asc' }
    });

    for (const ep of remainingEps) {
      if (ep.videoUrl && ep.videoUrl.includes('hentaitube.online/episodes/')) {
        console.log(`Extracting clean player for anime "${anime.title}" Ep ${ep.episodeNumber}: ${ep.videoUrl}`);
        try {
          const res = await extractCleanEmbedFromWebPage(ep.videoUrl);
          if (res.cleanUrl && res.cleanUrl !== ep.videoUrl) {
            console.log(`  -> Resolved to clean embed: ${res.cleanUrl}`);
            await prisma.episode.update({
              where: { id: ep.id },
              data: { videoUrl: res.cleanUrl }
            });
            extractedUrlsCount++;
          }
        } catch (err: any) {
          console.error(`  -> Failed to extract: ${err.message}`);
        }
      }
    }

    // Update totalEpisodes to match exact count
    const finalCount = await prisma.episode.count({ where: { animeId: anime.id } });
    await prisma.anime.update({
      where: { id: anime.id },
      data: { totalEpisodes: Math.max(finalCount, 1) }
    });
  }

  console.log(`Cleanup complete!`);
  console.log(`- Cleaned ${cleanedAnimeCount} anime`);
  console.log(`- Deleted ${deletedEpisodesCount} dummy empty episodes`);
  console.log(`- Extracted ${extractedUrlsCount} clean embed URLs`);

  // Print Paihame Kazoku's new status
  const paihame = await prisma.anime.findFirst({
    where: { title: { contains: 'Paihame' } },
    include: { episodes: true }
  });
  if (paihame) {
    console.log('\nPaihame Kazoku updated state:');
    console.log(`- totalEpisodes: ${paihame.totalEpisodes}`);
    console.log(`- episodes count: ${paihame.episodes.length}`);
    for (const ep of paihame.episodes) {
      console.log(`  * Ep ${ep.episodeNumber}: ${ep.videoUrl}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
