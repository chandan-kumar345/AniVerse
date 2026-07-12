const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const query = `
query ($search: String) {
  Media (search: $search, type: ANIME) {
    title {
      romaji
      english
    }
    bannerImage
    coverImage {
      extraLarge
      large
    }
  }
}
`;
async function fetchAniListImage(title) {
    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: { search: title }
            })
        });

        if (!response.ok) {
            throw new Error(`AniList returned status ${response.status}`);
        }

        const data = await response.json();
        return data?.data?.Media || null;
    } catch (err) {
        console.error(`Error fetching images for ${title}:`, err.message);
        return null;
    }
}
async function main() {
    const animeList = await prisma.anime.findMany();
    console.log(`Found ${animeList.length} anime in database to update.`);

    for (const anime of animeList) {
        console.log(`Processing: ${anime.title}...`);
        let media = await fetchAniListImage(anime.title);

        if (!media && anime.englishTitle) {
            console.log(`  Trying English title: ${anime.englishTitle}...`);
            media = await fetchAniListImage(anime.englishTitle);
        }

        if (media) {
            const banner = media.bannerImage || anime.bannerImage;
            const poster = media.coverImage?.extraLarge || media.coverImage?.large || anime.posterImage;

            console.log(`  Updating - Banner: ${banner}, Poster: ${poster}`);

            await prisma.anime.update({
                where: { id: anime.id },
                data: {
                    bannerImage: banner,
                    posterImage: poster
                }
            });
        } else {
            console.log(`  Could not find images for ${anime.title} on AniList.`);
        }
        // Rate limit safeguard
        await new Promise(r => setTimeout(r, 600));
    }

    console.log('Update complete!');
    await prisma.$disconnect();
}
main().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
