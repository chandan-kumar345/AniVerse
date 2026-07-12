const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const animeTitles = [
  'Death Note',
  'Fullmetal Alchemist: Brotherhood',
  'Hunter x Hunter (2011)',
  'Steins;Gate',
  'My Hero Academia',
  'Your Name.',
  'Spirited Away',
  'Kaiju No. 8',
  'Wind Breaker',
  'Mushoku Tensei: Jobless Reincarnation',
  'KonoSuba: God\'s Blessing on this Wonderful World!',
  'Code Geass: Lelouch of the Rebellion'
];

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

const query = `
query ($search: String) {
  Media (search: $search, type: ANIME) {
    idMal
    title {
      romaji
      english
    }
    description
    bannerImage
    coverImage {
      large
    }
    averageScore
    format
    status
    startDate {
      year
    }
    genres
    duration
    studios(isMain: true) {
      nodes {
        name
      }
    }
  }
}
`;

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function fetchAnimeInfo(title) {
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
      console.log(`Failed to fetch ${title} from AniList: ${response.statusText}`);
      return null;
    }

    const resData = await response.json();
    return resData?.data?.Media || null;
  } catch (err) {
    console.error(`Error querying AniList for ${title}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('Starting anime import script...');

  for (const title of animeTitles) {
    console.log(`\nProcessing: ${title}...`);
    const media = await fetchAnimeInfo(title);

    if (!media) {
      console.log(`  Skipping ${title} - not found on AniList.`);
      continue;
    }

    const animeTitle = media.title.english || media.title.romaji;
    const slug = slugify(animeTitle);

    // Check if it already exists
    const existing = await prisma.anime.findUnique({
      where: { slug }
    });

    if (existing) {
      console.log(`  Anime with slug "${slug}" already exists in database. Skipping.`);
      continue;
    }

    // Clean description HTML
    let cleanedDescription = media.description || 'No description available.';
    cleanedDescription = cleanedDescription.replace(/<[^>]*>/g, '');

    // Map status
    let status = 'Finished Airing';
    if (media.status === 'RELEASING') {
      status = 'Currently Airing';
    } else if (media.status === 'NOT_YET_RELEASED') {
      status = 'Not Yet Aired';
    }

    // Format fields
    const score = media.averageScore ? (media.averageScore / 10) : 7.5;
    const type = media.format || 'TV';
    const studio = media.studios?.nodes?.[0]?.name || 'Unknown';
    const genres = media.genres ? media.genres.join(', ') : 'Action';
    const releasedYear = media.startDate?.year || new Date().getFullYear();
    const duration = media.duration ? `${media.duration} min` : '24 min';

    console.log(`  Creating database record for: ${animeTitle} (${releasedYear})`);
    
    // Create Anime record
    const createdAnime = await prisma.anime.create({
      data: {
        malId: media.idMal,
        slug,
        title: animeTitle,
        englishTitle: media.title.english || null,
        description: cleanedDescription,
        bannerImage: media.bannerImage || media.coverImage?.large,
        posterImage: media.coverImage?.large,
        rating: 'PG-13',
        score,
        type,
        studio,
        status,
        releasedYear,
        duration,
        genres,
        isTrending: false,
        isPopular: true
      }
    });

    // Create 12 episodes for the anime
    console.log(`  Seeding 12 episodes for: ${animeTitle}`);
    const episodeData = [];
    for (let i = 1; i <= 12; i++) {
      // Pick a random sample video url
      const videoUrl = sampleVideos[(i - 1) % sampleVideos.length];
      episodeData.push({
        animeId: createdAnime.id,
        episodeNumber: i,
        title: `Episode ${i}`,
        videoUrl,
        thumbnail: createdAnime.bannerImage,
        duration: '24 min'
      });
    }

    await prisma.episode.createMany({
      data: episodeData
    });

    console.log(`  Successfully added ${animeTitle} and its episodes!`);
    
    // Tiny delay to avoid hitting rate limits
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\nAll anime imports complete!');
}

main().catch(err => {
  console.error('Fatal error during import:', err);
  prisma.$disconnect();
}).finally(() => {
  prisma.$disconnect();
});
