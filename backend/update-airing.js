const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating anime airing status in database...');

  const titlesToUpdate = [
    'My Hero Academia',
    'WIND BREAKER',
    'Kaiju No. 8',
    'Demon Slayer: Hashira Training Arc'
  ];

  for (const title of titlesToUpdate) {
    // Find anime by title or englishTitle
    const anime = await prisma.anime.findFirst({
      where: {
        OR: [
          { title: { contains: title } },
          { englishTitle: { contains: title } }
        ]
      }
    });

    if (anime) {
      console.log(`Updating "${anime.title}" status to "Currently Airing"...`);
      await prisma.anime.update({
        where: { id: anime.id },
        data: { status: 'Currently Airing' }
      });
    } else {
      console.log(`Could not find anime matching: "${title}"`);
    }
  }

  console.log('Update complete!');
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
}).finally(() => {
  prisma.$disconnect();
});
