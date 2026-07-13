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
const SEARCH_OVERRIDES = {
    "Frieren: Beyond Journey's End": "Frieren",
    "Attack on Titan: The Final Season": "Attack on Titan Final Season"
};

async function main() {
    const animeList = await prisma.anime.findMany();
    console.log(`Found ${animeList.length} anime in database to update.`);

    for (const anime of animeList) {
        console.log(`Processing: ${anime.title}...`);
        
        let searchTerm = SEARCH_OVERRIDES[anime.title] || anime.title;
        let media = await fetchAniListImage(searchTerm);

        if ((!media || !media.bannerImage) && anime.englishTitle) {
            console.log(`  Trying English title: ${anime.englishTitle}...`);
            const engMedia = await fetchAniListImage(anime.englishTitle);
            if (engMedia && engMedia.bannerImage) {
                media = engMedia;
            }
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
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('Update complete!');
    await prisma.$disconnect();
}
main().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
