import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BATCH_QUERY = `
  query ($idMal_in: [Int]) {
    Page(page: 1, perPage: 50) {
      media(idMal_in: $idMal_in, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
        }
        coverImage {
          extraLarge
          large
        }
        bannerImage
      }
    }
  }
`;

const SEARCH_QUERY = `
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
      }
      coverImage {
        extraLarge
        large
      }
      bannerImage
    }
  }
`;

async function fetchBatchAniList(malIds: number[]): Promise<any[]> {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: BATCH_QUERY, variables: { idMal_in: malIds } })
    });
    if (!res.ok) {
      console.warn(`AniList batch HTTP ${res.status}`);
      return [];
    }
    const data = await res.json() as any;
    return data?.data?.Page?.media || [];
  } catch (err) {
    console.error('Batch query error:', err);
    return [];
  }
}

async function fetchSingleByTitle(title: string): Promise<any | null> {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: title } })
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data?.data?.Media || null;
  } catch (err) {
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('========================================================');
  console.log('🎨 Starting Anime Real Poster Image Hydration...');
  console.log('========================================================\n');

  // Find all anime that currently have unsplash or placeholder posterImage
  const allAnime = await prisma.anime.findMany({
    select: { id: true, title: true, englishTitle: true, malId: true, posterImage: true }
  });

  const needsUpdate = allAnime.filter(a => 
    !a.posterImage || 
    a.posterImage.includes('unsplash') || 
    a.posterImage.includes('placeholder')
  );

  console.log(`Found ${needsUpdate.length} anime needing real poster image hydration (out of ${allAnime.length} total).`);

  // Group anime with malId into chunks of 40 for batch retrieval
  const withMalId = needsUpdate.filter(a => a.malId !== null && a.malId !== undefined);
  const withoutMalId = needsUpdate.filter(a => !a.malId);

  const chunkSize = 40;
  let updatedCount = 0;

  for (let i = 0; i < withMalId.length; i += chunkSize) {
    const chunk = withMalId.slice(i, i + chunkSize);
    const malIds = chunk.map(a => a.malId as number);

    console.log(`Fetching batch ${Math.floor(i / chunkSize) + 1} (${chunk.length} titles)...`);
    const mediaList = await fetchBatchAniList(malIds);

    const mediaMap = new Map<number, any>();
    for (const m of mediaList) {
      if (m.idMal) mediaMap.set(m.idMal, m);
    }

    for (const anime of chunk) {
      const media = mediaMap.get(anime.malId as number);
      if (media && (media.coverImage?.extraLarge || media.coverImage?.large)) {
        const realPoster = media.coverImage.extraLarge || media.coverImage.large;
        const realBanner = media.bannerImage || realPoster;

        await prisma.anime.update({
          where: { id: anime.id },
          data: {
            posterImage: realPoster,
            bannerImage: realBanner
          }
        });
        updatedCount++;
      } else {
        // Fallback to title search if batch didn't find it by malId
        await sleep(350); // respect rate limits
        const searchMedia = await fetchSingleByTitle(anime.title);
        if (searchMedia && (searchMedia.coverImage?.extraLarge || searchMedia.coverImage?.large)) {
          const realPoster = searchMedia.coverImage.extraLarge || searchMedia.coverImage.large;
          const realBanner = searchMedia.bannerImage || realPoster;
          await prisma.anime.update({
            where: { id: anime.id },
            data: {
              posterImage: realPoster,
              bannerImage: realBanner
            }
          });
          updatedCount++;
        }
      }
    }

    // Gentle delay between batches to respect AniList 90 req/min limit
    await sleep(700);
  }

  // Handle any remaining anime without malId by title search
  if (withoutMalId.length > 0) {
    console.log(`\nHydrating ${withoutMalId.length} anime without malId via title search...`);
    for (const anime of withoutMalId) {
      await sleep(400);
      const media = await fetchSingleByTitle(anime.title);
      if (media && (media.coverImage?.extraLarge || media.coverImage?.large)) {
        const realPoster = media.coverImage.extraLarge || media.coverImage.large;
        const realBanner = media.bannerImage || realPoster;
        await prisma.anime.update({
          where: { id: anime.id },
          data: {
            posterImage: realPoster,
            bannerImage: realBanner
          }
        });
        updatedCount++;
      }
    }
  }

  console.log('\n========================================================');
  console.log(`✅ Real Poster Hydration Complete! Updated ${updatedCount}/${needsUpdate.length} titles.`);
  console.log('========================================================');
}

main().catch(console.error).finally(() => prisma.$disconnect());
