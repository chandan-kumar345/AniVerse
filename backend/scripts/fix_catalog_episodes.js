const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KNOWN_SERIES = [
  { slug: 'bleach', title: 'Bleach', malId: 269, tmdbId: 30984, totalEpisodes: 366, hasDub: true, hasHindi: true },
  { slug: 'bleach-thousand-year-blood-war', title: 'Bleach: Thousand-Year Blood War', malId: 41467, tmdbId: 30984, totalEpisodes: 13, hasDub: true, hasHindi: true },
  { slug: 'bleach-thousand-year-blood-war-the-separation', title: 'Bleach: Thousand-Year Blood War - The Separation', malId: 53998, tmdbId: 30984, totalEpisodes: 13, hasDub: true, hasHindi: true },
  { slug: 'bleach-thousand-year-blood-war-the-conflict', title: 'Bleach: Thousand-Year Blood War - The Conflict', malId: 56206, tmdbId: 30984, totalEpisodes: 13, hasDub: true, hasHindi: true },
  { slug: 'bleach-thousand-year-blood-war-the-calamity', title: 'BLEACH: Thousand-Year Blood War - The Calamity', malId: 60636, tmdbId: 30984, totalEpisodes: 13, hasDub: true, hasHindi: true },
  { slug: 'naruto', title: 'Naruto', malId: 20, tmdbId: 46260, totalEpisodes: 220, hasDub: true, hasHindi: true },
  { slug: 'naruto-shippuden', title: 'Naruto Shippuden', malId: 1735, tmdbId: 31910, totalEpisodes: 500, hasDub: true, hasHindi: true },
  { slug: 'hunter-x-hunter-2011', title: 'Hunter x Hunter (2011)', malId: 11061, tmdbId: 46298, totalEpisodes: 148, hasDub: true, hasHindi: false },
  { slug: 'demon-slayer-kimetsu-no-yaiba', title: 'Demon Slayer: Kimetsu no Yaiba', malId: 38000, tmdbId: 85937, totalEpisodes: 26, hasDub: true, hasHindi: true },
  { slug: 'demon-slayer-entertainment-district-arc', title: 'Demon Slayer: Entertainment District Arc', malId: 47778, tmdbId: 85937, totalEpisodes: 11, hasDub: true, hasHindi: true },
  { slug: 'demon-slayer-swordsmith-village-arc', title: 'Demon Slayer: Swordsmith Village Arc', malId: 51019, tmdbId: 85937, totalEpisodes: 11, hasDub: true, hasHindi: true },
  { slug: 'attack-on-titan', title: 'Attack on Titan', malId: 16498, tmdbId: 1429, totalEpisodes: 25, hasDub: true, hasHindi: true },
  { slug: 'attack-on-titan-season-2', title: 'Attack on Titan Season 2', malId: 25777, tmdbId: 1429, totalEpisodes: 12, hasDub: true, hasHindi: true },
  { slug: 'attack-on-titan-season-3', title: 'Attack on Titan Season 3', malId: 35760, tmdbId: 1429, totalEpisodes: 22, hasDub: true, hasHindi: true },
  { slug: 'death-note', title: 'Death Note', malId: 1535, tmdbId: 13916, totalEpisodes: 37, hasDub: true, hasHindi: true },
  { slug: 'solo-leveling', title: 'Solo Leveling', malId: 52299, tmdbId: 127532, totalEpisodes: 12, hasDub: true, hasHindi: true },
  { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', malId: 40748, tmdbId: 95479, totalEpisodes: 24, hasDub: true, hasHindi: true },
  { slug: 'jujutsu-kaisen-season-2', title: 'Jujutsu Kaisen Season 2', malId: 51009, tmdbId: 95479, totalEpisodes: 23, hasDub: true, hasHindi: true },
  { slug: 'chainsaw-man', title: 'Chainsaw Man', malId: 44511, tmdbId: 114410, totalEpisodes: 12, hasDub: true, hasHindi: true },
  { slug: 'my-hero-academia', title: 'My Hero Academia', malId: 31964, tmdbId: 65930, totalEpisodes: 13, hasDub: true, hasHindi: true },
  { slug: 'my-hero-academia-season-2', title: 'My Hero Academia Season 2', malId: 33486, tmdbId: 65930, totalEpisodes: 25, hasDub: true, hasHindi: true },
  { slug: 'my-hero-academia-season-3', title: 'My Hero Academia Season 3', malId: 36456, tmdbId: 65930, totalEpisodes: 25, hasDub: true, hasHindi: true },
  { slug: 'my-hero-academia-season-4', title: 'My Hero Academia Season 4', malId: 38408, tmdbId: 65930, totalEpisodes: 25, hasDub: true, hasHindi: true },
  { slug: 'my-hero-academia-season-5', title: 'My Hero Academia Season 5', malId: 41587, tmdbId: 65930, totalEpisodes: 25, hasDub: true, hasHindi: true },
  { slug: 'my-hero-academia-season-6', title: 'My Hero Academia Season 6', malId: 49918, tmdbId: 65930, totalEpisodes: 25, hasDub: true, hasHindi: true },
  { slug: 'dandadan', title: 'Dandadan', malId: 57334, tmdbId: 240411, totalEpisodes: 12, hasDub: true, hasHindi: true },
  { slug: 'blue-lock', title: 'Blue Lock', malId: 49596, tmdbId: 135898, totalEpisodes: 24, hasDub: true, hasHindi: true },
  { slug: 'blue-lock-season-2', title: 'Blue Lock Season 2', malId: 54865, tmdbId: 135898, totalEpisodes: 14, hasDub: true, hasHindi: true },
];

async function run() {
  console.log('--- Starting Database Episode & Streaming Fix ---');

  for (const s of KNOWN_SERIES) {
    let anime = await prisma.anime.findUnique({
      where: { slug: s.slug },
      include: { episodes: true }
    });

    if (!anime) {
      // Find parent or similar
      const parent = await prisma.anime.findFirst({
        where: { title: { contains: s.title.split('-')[0].trim() } }
      });

      console.log(`Creating missing anime entry for "${s.title}" (${s.slug})...`);
      anime = await prisma.anime.create({
        data: {
          slug: s.slug,
          title: s.title,
          englishTitle: s.title,
          malId: s.malId,
          tmdbId: s.tmdbId,
          description: parent?.description || `${s.title} streaming on AniVerse`,
          posterImage: parent?.posterImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
          bannerImage: parent?.bannerImage || parent?.posterImage,
          rating: 'PG-13',
          score: parent?.score || 8.5,
          type: 'TV',
          status: 'Finished Airing',
          genres: parent?.genres || 'Action, Shounen, Supernatural',
          totalEpisodes: s.totalEpisodes,
          hasDub: s.hasDub,
          hasHindi: s.hasHindi,
          isPopular: true
        },
        include: { episodes: true }
      });
    } else {
      await prisma.anime.update({
        where: { id: anime.id },
        data: {
          malId: s.malId,
          tmdbId: s.tmdbId,
          totalEpisodes: Math.max(anime.totalEpisodes || 0, s.totalEpisodes),
          hasDub: s.hasDub,
          hasHindi: s.hasHindi
        }
      });
    }

    const existingEpNums = new Set(anime.episodes.map(e => e.episodeNumber));
    const toCreate = [];

    for (let ep = 1; ep <= s.totalEpisodes; ep++) {
      const vUrl = `https://vidsrc.pm/embed/anime?mal=${s.malId}&ep=${ep}`;
      const dUrl = s.hasDub ? `https://vidsrc.pm/embed/anime?mal=${s.malId}&ep=${ep}&dub=1` : null;
      const hUrl = s.hasHindi ? `https://vidsrc.pm/embed/anime?mal=${s.malId}&ep=${ep}&lang=hi` : null;

      if (!existingEpNums.has(ep)) {
        toCreate.push({
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
      } else {
        // Fix existing episode if it has sample BigBuckBunny or empty videoUrl
        const current = anime.episodes.find(e => e.episodeNumber === ep);
        if (!current.videoUrl || current.videoUrl.includes('sample/BigBuckBunny') || current.videoUrl.includes('ElephantsDream')) {
          await prisma.episode.update({
            where: { id: current.id },
            data: {
              videoUrl: vUrl,
              dubVideoUrl: dUrl,
              hindiVideoUrl: hUrl
            }
          });
        }
      }
    }

    if (toCreate.length > 0) {
      console.log(`Seeding ${toCreate.length} episodes for "${s.title}" (${s.slug})...`);
      // Chunk inserts in batches of 50
      for (let i = 0; i < toCreate.length; i += 50) {
        const batch = toCreate.slice(i, i + 50);
        await prisma.episode.createMany({ data: batch });
      }
      console.log(`  -> Successfully seeded ${toCreate.length} episodes for ${s.title}`);
    } else {
      console.log(`"${s.title}" already has all ${s.totalEpisodes} episodes in DB.`);
    }
  }

  // Also replace any remaining BigBuckBunny/sample videoUrls across ANY other anime in the DB
  const sampleEps = await prisma.episode.findMany({
    where: {
      OR: [
        { videoUrl: { contains: 'commondatastorage.googleapis.com' } },
        { videoUrl: { contains: 'BigBuckBunny' } }
      ]
    },
    include: { anime: true },
    take: 500
  });

  console.log(`Found ${sampleEps.length} episodes with sample placeholder videos. Updating to real stream embeds...`);
  for (const ep of sampleEps) {
    if (ep.anime.malId) {
      await prisma.episode.update({
        where: { id: ep.id },
        data: {
          videoUrl: `https://vidsrc.pm/embed/anime?mal=${ep.anime.malId}&ep=${ep.episodeNumber}`,
          dubVideoUrl: ep.anime.hasDub ? `https://vidsrc.pm/embed/anime?mal=${ep.anime.malId}&ep=${ep.episodeNumber}&dub=1` : null,
          hindiVideoUrl: ep.anime.hasHindi ? `https://vidsrc.pm/embed/anime?mal=${ep.anime.malId}&ep=${ep.episodeNumber}&lang=hi` : null
        }
      });
    }
  }

  console.log('--- Database Episode & Streaming Fix Complete! ---');
}

run()
  .catch(err => {
    console.error('Error running fix script:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
