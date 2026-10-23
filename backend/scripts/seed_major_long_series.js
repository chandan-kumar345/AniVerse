const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAJOR_SERIES = [
  {
    slug: 'one-piece',
    title: 'One Piece',
    malId: 21,
    tmdbId: 37854,
    totalEpisodes: 1122,
    hasDub: true,
    hasHindi: true
  },
  {
    slug: 'dragon-ball-z',
    title: 'Dragon Ball Z',
    malId: 813,
    tmdbId: 12971,
    totalEpisodes: 291,
    hasDub: true,
    hasHindi: true
  },
  {
    slug: 'dragon-ball-super',
    title: 'Dragon Ball Super',
    malId: 30694,
    tmdbId: 62710,
    totalEpisodes: 131,
    hasDub: true,
    hasHindi: true
  },
  {
    slug: 'dragon-ball',
    title: 'Dragon Ball',
    malId: 223,
    tmdbId: 12696,
    totalEpisodes: 153,
    hasDub: true,
    hasHindi: true
  },
  {
    slug: 'black-clover',
    title: 'Black Clover',
    malId: 34572,
    tmdbId: 73223,
    totalEpisodes: 170,
    hasDub: true,
    hasHindi: true
  },
  {
    slug: 'fullmetal-alchemist-brotherhood',
    title: 'Fullmetal Alchemist: Brotherhood',
    malId: 5114,
    tmdbId: 31911,
    totalEpisodes: 64,
    hasDub: true,
    hasHindi: false
  },
  {
    slug: 'fairy-tail',
    title: 'Fairy Tail',
    malId: 6702,
    tmdbId: 46261,
    totalEpisodes: 175,
    hasDub: true,
    hasHindi: false
  },
  {
    slug: 'gintama',
    title: 'Gintama',
    malId: 918,
    tmdbId: 57041,
    totalEpisodes: 201,
    hasDub: true,
    hasHindi: false
  },
  {
    slug: 'boruto-naruto-next-generations',
    title: 'Boruto: Naruto Next Generations',
    malId: 34566,
    tmdbId: 70881,
    totalEpisodes: 293,
    hasDub: true,
    hasHindi: true
  }
];

async function seedMajorSeries() {
  console.log('=== Starting Major Long-Running Anime Seeding ===');

  for (const s of MAJOR_SERIES) {
    const anime = await prisma.anime.findUnique({
      where: { slug: s.slug },
      include: {
        episodes: {
          select: { episodeNumber: true }
        }
      }
    });

    if (!anime) {
      console.warn(`Anime with slug "${s.slug}" not found in database, skipping.`);
      continue;
    }

    console.log(`\nProcessing "${anime.title}" (${s.slug})... Current DB episodes: ${anime.episodes.length}, Target: ${s.totalEpisodes}`);

    // 1. Update anime metadata
    await prisma.anime.update({
      where: { id: anime.id },
      data: {
        malId: s.malId,
        tmdbId: s.tmdbId,
        totalEpisodes: s.totalEpisodes,
        hasDub: s.hasDub,
        hasHindi: s.hasHindi
      }
    });

    const existingEpNums = new Set(anime.episodes.map(e => e.episodeNumber));
    const newEpisodes = [];

    for (let ep = 1; ep <= s.totalEpisodes; ep++) {
      if (!existingEpNums.has(ep)) {
        const vUrl = `https://vidsrc.pm/embed/anime?mal=${s.malId}&ep=${ep}`;
        const dUrl = s.hasDub ? `https://vidsrc.pm/embed/anime?mal=${s.malId}&ep=${ep}&dub=1` : null;
        const hUrl = s.hasHindi ? `https://vidsrc.pm/embed/anime?mal=${s.malId}&ep=${ep}&lang=hi` : null;

        newEpisodes.push({
          animeId: anime.id,
          episodeNumber: ep,
          title: `Episode ${ep}`,
          videoUrl: vUrl,
          dubVideoUrl: dUrl,
          hindiVideoUrl: hUrl,
          thumbnail: anime.bannerImage || anime.posterImage,
          duration: '24 min',
          status: 'AVAILABLE'
        });
      }
    }

    if (newEpisodes.length > 0) {
      console.log(`Inserting ${newEpisodes.length} new episodes for "${anime.title}" in batches...`);
      // Insert in batches of 100 to avoid SQLite variable limit
      const BATCH_SIZE = 100;
      for (let i = 0; i < newEpisodes.length; i += BATCH_SIZE) {
        const batch = newEpisodes.slice(i, i + BATCH_SIZE);
        await prisma.episode.createMany({
          data: batch
        });
      }
      console.log(`✓ Successfully seeded ${newEpisodes.length} episodes for "${anime.title}".`);
    } else {
      console.log(`✓ "${anime.title}" already has all ${s.totalEpisodes} episodes in DB.`);
    }
  }

  console.log('\n=== All Major Series Seeding Completed Successfully! ===');
}

seedMajorSeries()
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
