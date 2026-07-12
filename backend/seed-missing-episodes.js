const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const animes = await prisma.anime.findMany({
    include: {
      episodes: true
    }
  });

  const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  ];

  console.log(`Checking ${animes.length} anime entries for missing episodes...`);

  for (const anime of animes) {
    if (anime.episodes.length === 0) {
      console.log(`Anime "${anime.title}" has 0 episodes! Seeding 12 episodes...`);
      const episodeData = [];
      for (let i = 1; i <= 12; i++) {
        const videoUrl = sampleVideos[(i - 1) % sampleVideos.length];
        episodeData.push({
          animeId: anime.id,
          episodeNumber: i,
          title: `Episode ${i}`,
          videoUrl,
          thumbnail: anime.bannerImage || anime.posterImage,
          duration: '24 min'
        });
      }
      await prisma.episode.createMany({
        data: episodeData
      });
      console.log(`  Added 12 episodes for "${anime.title}".`);
    } else {
      console.log(`Anime "${anime.title}" already has ${anime.episodes.length} episodes.`);
    }
  }
  console.log('Sanity check and seeding complete!');
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
