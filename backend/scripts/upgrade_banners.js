const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const animes = await prisma.anime.findMany();
  console.log(`Checking ${animes.length} anime records...`);

  const updates = [
    {
      slug: 'dragon-ball-z',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/813-03ZLvWJgR6Wd.jpg'
    },
    {
      slug: 'your-name',
      bannerImage: 'https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg'
    },
    {
      slug: 'black-clover-season-2',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/97940-1URQdQ4U1a0b.jpg'
    }
  ];

  for (const upd of updates) {
    const existing = animes.find(a => a.slug === upd.slug);
    if (existing) {
      console.log(`Updating banner for "${existing.title}"...`);
      await prisma.anime.update({
        where: { id: existing.id },
        data: { bannerImage: upd.bannerImage }
      });
    }
  }

  console.log('Banner upgrade complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
