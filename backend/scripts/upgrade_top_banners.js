const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HD_BANNERS = [
  { match: 'one-piece', banner: 'https://image.tmdb.org/t/p/original/v38qp4bySLTXYu3MF8r5GD51FN3.jpg' },
  { match: 'solo-leveling', banner: 'https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg' },
  { match: 'jujutsu-kaisen-season-2', banner: 'https://image.tmdb.org/t/p/original/qpin8cASXEVtwhzNsprHYFiOAGk.jpg' },
  { match: 'jujutsu-kaisen-0', banner: 'https://image.tmdb.org/t/p/original/qpin8cASXEVtwhzNsprHYFiOAGk.jpg' },
  { match: 'jujutsu-kaisen', banner: 'https://image.tmdb.org/t/p/original/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg' },
  { match: 'demon-slayer', banner: 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg' },
  { match: 'bleach', banner: 'https://image.tmdb.org/t/p/original/o0NsbcIvsllg6CJX0FBFY8wWbsn.jpg' },
  { match: 'attack-on-titan', banner: 'https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg' },
  { match: 'chainsaw-man', banner: 'https://image.tmdb.org/t/p/original/5DUMPBSnHOZsbBv81GFXZXvDpo6.jpg' },
  { match: 'dan-da-dan', banner: 'https://image.tmdb.org/t/p/original/uNTrRKIOyKYISthoeizghtXPEOK.jpg' },
  { match: 'naruto', banner: 'https://image.tmdb.org/t/p/original/z0YhJvomqedHF85bplUJEotkN5l.jpg' },
  { match: 'dragon-ball-super', banner: 'https://image.tmdb.org/t/p/original/qA2UwUQbj05aeBMCuC0mHSQ4loE.jpg' },
  { match: 'dragon-ball-z', banner: 'https://image.tmdb.org/t/p/original/ydf1CeiBLfdxiyNTpskM0802TKl.jpg' },
  { match: 'hunter-x-hunter', banner: 'https://image.tmdb.org/t/p/original/bFKKyCI89Xq98Gul8cGox8K3sZa.jpg' },
  { match: 'blue-lock', banner: 'https://image.tmdb.org/t/p/original/seMRyWVwIVBWbC9xaMzDMZJ8fUH.jpg' },
  { match: 'black-clover', banner: 'https://image.tmdb.org/t/p/original/qu9epTZh29fGUkY7ZYc9PVsv0Ig.jpg' },
  { match: 'one-punch-man', banner: 'https://image.tmdb.org/t/p/original/s0w8JbuNNxL1YgaHeDWih12C3jG.jpg' },
  { match: 'kaiju-no-8', banner: 'https://image.tmdb.org/t/p/original/htGeuCcNhlBe8GTx3izKOsd8frw.jpg' },
  { match: 'my-hero-academia', banner: 'https://image.tmdb.org/t/p/original/3ILMlmC30QUnYkY3XEBOyJ82Dqu.jpg' },
  { match: 'spy-x-family', banner: 'https://image.tmdb.org/t/p/original/lysUnU6V0VfcthDbviuVlIqgHOR.jpg' },
  { match: 'death-note', banner: 'https://image.tmdb.org/t/p/original/z8IPicmEKXUO4I2UDdMEqw7RqOE.jpg' },
  { match: 'fullmetal-alchemist', banner: 'https://image.tmdb.org/t/p/original/2UG177tWHy7xRmMKWJHB7nAUmKd.jpg' },
  { match: 'your-name', banner: 'https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg' }
];

async function main() {
  const animes = await prisma.anime.findMany();
  console.log(`Auditing banners for ${animes.length} database entries...`);

  for (const item of HD_BANNERS) {
    const targets = animes.filter(a => a.slug.toLowerCase().includes(item.match) || a.title.toLowerCase().includes(item.match));
    for (const t of targets) {
      console.log(`Setting ultra-HD 4K banner for: "${t.title}" (${t.slug})`);
      await prisma.anime.update({
        where: { id: t.id },
        data: { bannerImage: item.banner }
      });
    }
  }

  console.log('Finished updating database banners with ultra-HD assets!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
