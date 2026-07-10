import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

const animeData = [
  {
    malId: 45576,
    title: 'Bleach: Thousand-Year Blood War',
    englishTitle: 'Bleach: TYBW',
    description: 'The peace is suddenly broken when warning sirens wail through the Soul Society. Residents are disappearing without a trace and nobody knows who is behind it. Meanwhile, a dark shadow is also extending itself toward Ichigo and his friends in Karakura Town...',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1908/135431.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1280/kt9nqY576Ocn8NEALZ5i5g5t1KA.jpg',
    rating: 'R - 17+',
    score: 9.07,
    type: 'TV',
    studio: 'Pierrot',
    status: 'Finished Airing',
    releasedYear: 2022,
    duration: '24 min',
    genres: 'Action, Fantasy, Adventure, Shounen',
    isTrending: true,
    isPopular: true,
    epCount: 13,
  },
  {
    malId: 55701,
    title: 'Demon Slayer: Kimetsu no Yaiba - Hashira Training Arc',
    englishTitle: 'Demon Slayer: Hashira Training Arc',
    description: 'Tanjirou goes to see the Stone Hashira, Himejima, who intends to prepare him for the battles to come. The training to become a Hashira is intense and demanding, and earning Himejima\'s approval seems impossible, but Tanjirou won\'t give up!',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1158/142278.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1280/nTvM6mhWxN7oLXY1j2xRnative8.jpg',
    rating: 'R - 17+',
    score: 8.65,
    type: 'TV',
    studio: 'ufotable',
    status: 'Finished Airing',
    releasedYear: 2024,
    duration: '24 min',
    genres: 'Action, Fantasy, Historical, Shounen',
    isTrending: true,
    isPopular: true,
    epCount: 8,
  },
  {
    malId: 51009,
    title: 'Jujutsu Kaisen Season 2',
    englishTitle: 'Jujutsu Kaisen S2',
    description: 'The past comes back to haunt Gojou Satoru and Getou Suguru. Revisit their high school days and explore the incident that fractured their relationship and changed the jujutsu world forever, followed by the devastating Shibuya Incident.',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1280/3ILMlmCj0crvGrt2jscVgzuHG7R.jpg',
    rating: 'R - 17+',
    score: 8.82,
    type: 'TV',
    studio: 'MAPPA',
    status: 'Finished Airing',
    releasedYear: 2023,
    duration: '23 min',
    genres: 'Action, Fantasy, School, Shounen',
    isTrending: true,
    isPopular: true,
    epCount: 23,
  },
  {
    malId: 21,
    title: 'One Piece',
    englishTitle: 'One Piece',
    description: 'Gol D. Roger was known as the "Pirate King," the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world. His last words before his death revealed the existence of the greatest treasure in the world, One Piece...',
    posterImage: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1280/41724uiK763l252l2v2v4rJzJ.jpg',
    rating: 'PG-13',
    score: 8.72,
    type: 'TV',
    studio: 'Toei Animation',
    status: 'Currently Airing',
    releasedYear: 1999,
    duration: '24 min',
    genres: 'Action, Adventure, Comedy, Fantasy, Shounen',
    isTrending: true,
    isPopular: true,
    epCount: 15,
  },
  {
    malId: 52299,
    title: 'Solo Leveling',
    englishTitle: 'Solo Leveling',
    description: 'In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect mankind from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a struggle for survival inside an extremely dangerous double dungeon.',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1170/124312.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1280/col61jXmqdJk2s5L3fR4xT4n24S.jpg',
    rating: 'R - 17+',
    score: 8.35,
    type: 'TV',
    studio: 'A-1 Pictures',
    status: 'Finished Airing',
    releasedYear: 2004,
    duration: '23 min',
    genres: 'Action, Adventure, Fantasy',
    isTrending: true,
    isPopular: true,
    epCount: 12,
  },
  {
    malId: 52991,
    title: 'Frieren: Beyond Journey\'s End',
    englishTitle: 'Frieren',
    description: 'Elf mage Frieren and her courageous fellow adventurers have defeated the Demon King and brought peace to the land. But Frieren will long outlive the rest of her former party. How will she come to understand what life means to the humans around her?',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1015/138042.jpg',
    bannerImage: 'https://images4.alphacoders.com/133/1330456.jpeg',
    rating: 'PG-13',
    score: 9.39,
    type: 'TV',
    studio: 'Madhouse',
    status: 'Finished Airing',
    releasedYear: 2023,
    duration: '24 min',
    genres: 'Adventure, Drama, Fantasy',
    isTrending: false,
    isPopular: true,
    epCount: 28,
  },
  {
    malId: 44511,
    title: 'Chainsaw Man',
    englishTitle: 'Chainsaw Man',
    description: 'Denji is a teenage boy living with a Chainsaw Devil named Pochita. Due to the debt his father left behind, he has been living a rock-bottom life while repaying his debt by harvesting devil corpses with Pochita. One day, Denji is betrayed and killed. As his consciousness fades, he makes a contract with Pochita and gets revived as "Chainsaw Man"!',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
    bannerImage: 'https://images8.alphacoders.com/123/1239103.jpg',
    rating: 'R - 17+',
    score: 8.51,
    type: 'TV',
    studio: 'MAPPA',
    status: 'Finished Airing',
    releasedYear: 2022,
    duration: '24 min',
    genres: 'Action, Comedy, Horror, Supernatural',
    isTrending: false,
    isPopular: true,
    epCount: 12,
  },
  {
    malId: 1735,
    title: 'Naruto Shippuden',
    englishTitle: 'Naruto Shippuden',
    description: 'It has been two and a half years since Naruto Uzumaki left Konohagakure, the Hidden Leaf Village, for intense training following events which fueled his desire to be stronger. Now Naruto is back, and the Akatsuki, a mysterious organization of elite rogue ninja, is closing in on their grand plan...',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1565/111305.jpg',
    bannerImage: 'https://images8.alphacoders.com/992/992449.jpg',
    rating: 'PG-13',
    score: 8.27,
    type: 'TV',
    studio: 'Pierrot',
    status: 'Finished Airing',
    releasedYear: 2007,
    duration: '23 min',
    genres: 'Action, Comedy, Fantasy, Martial Arts, Shounen',
    isTrending: false,
    isPopular: true,
    epCount: 20,
  },
  {
    malId: 40028,
    title: 'Attack on Titan: The Final Season',
    englishTitle: 'AoT Final Season',
    description: 'Gabi Braun and Falco Grice have been training their entire lives to inherit one of the seven Titans under Marley\'s control and aid their nation in eradicating the Eldians on Paradis. However, Eren Yeager and the Survey Corps launch a devastating counterattack...',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1000/110510.jpg',
    bannerImage: 'https://images.alphacoders.com/832/832943.jpg',
    rating: 'R - 17+',
    score: 8.91,
    type: 'TV',
    studio: 'MAPPA',
    status: 'Finished Airing',
    releasedYear: 2020,
    duration: '23 min',
    genres: 'Action, Drama, Suspense, Gore, Military',
    isTrending: false,
    isPopular: true,
    epCount: 16,
  },
  {
    malId: 42310,
    title: 'Cyberpunk: Edgerunners',
    englishTitle: 'Cyberpunk: Edgerunners',
    description: 'A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner—a mercenary outlaw also known as a cyberpunk.',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1814/128646.jpg',
    bannerImage: 'https://images3.alphacoders.com/125/1257922.jpg',
    rating: 'R - 17+',
    score: 8.61,
    type: 'TV',
    studio: 'Trigger',
    status: 'Finished Airing',
    releasedYear: 2022,
    duration: '24 min',
    genres: 'Action, Sci-Fi, Psychological',
    isTrending: false,
    isPopular: false,
    epCount: 10,
  },
  {
    malId: 1535,
    title: 'Death Note',
    englishTitle: 'Death Note',
    description: 'A shinigami, as a god of death, can kill any person—provided they see their victim\'s face and write their victim\'s name in a notebook called a Death Note. Ryuk, bored by the shinigami lifestyle, drops his notebook into the human realm, where it is found by high school prodigy Light Yagami.',
    posterImage: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg',
    bannerImage: 'https://images.alphacoders.com/901/901538.png',
    rating: 'R - 17+',
    score: 8.62,
    type: 'TV',
    studio: 'Madhouse',
    status: 'Finished Airing',
    releasedYear: 2006,
    duration: '23 min',
    genres: 'Mystery, Psychological, Supernatural, Thriller',
    isTrending: false,
    isPopular: true,
    epCount: 37,
  },
  {
    malId: 30276,
    title: 'One Punch Man',
    englishTitle: 'One Punch Man',
    description: 'The seemingly ordinary and unimpressive Saitama has a rather unique hobby: being a hero. In order to pursue his childhood dream, he trained relentlessly for three years—and lost all of his hair in the process. Now, Saitama is incredibly powerful, so much so that no enemy can defeat him in battle.',
    posterImage: 'https://cdn.myanimelist.net/images/anime/12/76049.jpg',
    bannerImage: 'https://images8.alphacoders.com/658/658257.png',
    rating: 'R - 17+',
    score: 8.5,
    type: 'TV',
    studio: 'Madhouse',
    status: 'Finished Airing',
    releasedYear: 2015,
    duration: '24 min',
    genres: 'Action, Comedy, Sci-Fi, Parody, Super Power',
    isTrending: false,
    isPopular: true,
    epCount: 12,
  },
  {
    malId: 5114,
    title: 'Fullmetal Alchemist: Brotherhood',
    englishTitle: 'FMAB',
    description: 'In order for something to be obtained, something of equal value must be lost. Alchemy is bound by this Law of Equivalent Exchange—something the young brothers Edward and Alphonse Elric only realize after attempting human transmutation, the one forbidden act of alchemy.',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
    bannerImage: 'https://images2.alphacoders.com/605/605798.jpg',
    rating: 'R - 17+',
    score: 9.1,
    type: 'TV',
    studio: 'Bones',
    status: 'Finished Airing',
    releasedYear: 2009,
    duration: '24 min',
    genres: 'Action, Adventure, Drama, Fantasy, Military',
    isTrending: false,
    isPopular: true,
    epCount: 15,
  },
  {
    malId: 11061,
    title: 'Hunter x Hunter (2011)',
    englishTitle: 'HxH',
    description: 'Hunter x Hunter is set in a world where Hunters exist to perform all manner of dangerous tasks like capturing criminals and bravely searching for lost treasures in uncharted territories. Twelve-year-old Gon Freecss is determined to become the best Hunter possible in hopes of finding his father.',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1337/99013.jpg',
    bannerImage: 'https://images6.alphacoders.com/606/606424.jpg',
    rating: 'PG-13',
    score: 9.04,
    type: 'TV',
    studio: 'Madhouse',
    status: 'Finished Airing',
    releasedYear: 2011,
    duration: '24 min',
    genres: 'Action, Adventure, Fantasy, Shounen',
    isTrending: false,
    isPopular: true,
    epCount: 15,
  },
  {
    malId: 55894,
    title: 'My Hero Academia Season 7',
    englishTitle: 'My Hero Academia S7',
    description: 'The battle between heroes and villains escalates to an all-out war. Deku and the students of Class 1-A join forces with professional heroes from across the globe to stop All For One and Shigaraki Tomura from bringing ruins to society.',
    posterImage: 'https://cdn.myanimelist.net/images/anime/1901/142921.jpg',
    bannerImage: 'https://images2.alphacoders.com/125/1250269.jpg',
    rating: 'PG-13',
    score: 8.12,
    type: 'TV',
    studio: 'Bones',
    status: 'Currently Airing',
    releasedYear: 2024,
    duration: '24 min',
    genres: 'Action, School, Super Power, Shounen',
    isTrending: false,
    isPopular: false,
    epCount: 10,
  }
];

async function main() {
  console.log('Clearing database...');
  await prisma.comment.deleteMany({});
  await prisma.watchlist.deleteMany({});
  await prisma.watchHistory.deleteMany({});
  await prisma.episode.deleteMany({});
  await prisma.anime.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding admin and sample users...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bankaitv.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: 'avatar1.png',
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'user@bankaitv.com',
      username: 'IchigoKurosaki',
      password: hashedPassword,
      role: 'USER',
      avatar: 'avatar2.png',
    },
  });

  console.log('Seeding anime & episodes...');

  for (const item of animeData) {
    const { epCount, ...animeFields } = item;
    const slug = animeFields.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const anime = await prisma.anime.create({
      data: {
        ...animeFields,
        slug,
      },
    });

    console.log(`Created anime: ${anime.title} with ID: ${anime.id}`);

    // Create episodes
    const episodes = [];
    for (let i = 1; i <= epCount; i++) {
      const videoUrl = sampleVideos[(i - 1 + anime.title.length) % sampleVideos.length];
      episodes.push({
        animeId: anime.id,
        episodeNumber: i,
        title: `Episode ${i}: ${getEpisodeName(anime.title, i)}`,
        videoUrl: videoUrl,
        thumbnail: anime.posterImage,
        duration: '24:00',
      });
    }

    await prisma.episode.createMany({
      data: episodes,
    });
  }

  // Seed sample watchlist and comments to make it look active
  const createdAnimes = await prisma.anime.findMany();
  if (createdAnimes.length >= 2) {
    // Add to watchlist for testUser
    await prisma.watchlist.createMany({
      data: [
        {
          userId: testUser.id,
          animeId: createdAnimes[0].id,
          status: 'WATCHING',
        },
        {
          userId: testUser.id,
          animeId: createdAnimes[1].id,
          status: 'PLAN_TO_WATCH',
        },
      ],
    });

    // Seed some comments for the first anime's episode 1
    const firstAnime = createdAnimes[0];
    const comment1 = await prisma.comment.create({
      data: {
        userId: testUser.id,
        animeId: firstAnime.id,
        episodeNumber: 1,
        text: 'This episode was absolutely fire! The animation is top tier.',
        likes: 12,
      },
    });

    await prisma.comment.create({
      data: {
        userId: adminUser.id,
        animeId: firstAnime.id,
        episodeNumber: 1,
        text: 'I completely agree! Studio did a phenomenal job adapting this chapter.',
        parentId: comment1.id,
        likes: 5,
      },
    });

    await prisma.comment.create({
      data: {
        userId: testUser.id,
        animeId: firstAnime.id,
        episodeNumber: 1,
        text: 'Can\'t wait for the next episode next Saturday!',
        parentId: comment1.id,
        likes: 3,
      },
    });

    // Seed watch history
    await prisma.watchHistory.create({
      data: {
        userId: testUser.id,
        animeId: firstAnime.id,
        episodeNumber: 1,
        watchedTime: 720, // 12 mins
        duration: 1440, // 24 mins
        progressPercentage: 50.0,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

function getEpisodeName(title: string, index: number): string {
  const titles: Record<string, string[]> = {
    'Bleach: Thousand-Year Blood War': [
      'The Blood Warfare',
      'Foundation Stones',
      'March of the Starcross',
      'Kill the Shadow',
      'Wrath as a Lightning',
      'The Fire',
      'Born in the Dark',
      'The Shooting Star Project [Zero Mix]',
      'The Drop',
      'The Battle',
      'Everything But the Rain',
      'Everything But the Rain "June Truth"',
      'The Blade is Me',
    ],
    'Demon Slayer: Kimetsu no Yaiba - Hashira Training Arc': [
      'To Defeat Muzan Kibutsuji',
      'The Water Hashira Giyu Tomioka\'s Pain',
      'Fully Recovered Tanjiro Joins the Training',
      'To Bring a Smile to One\'s Face',
      'Eating Demons',
      'The Strongest Hashira of the Demon Slayer Corps',
      'Stone Hashira Gyomei Himejima',
      'The Hashira Unite',
    ],
    'Jujutsu Kaisen Season 2': [
      'Hidden Inventory',
      'Hidden Inventory 2',
      'Hidden Inventory 3',
      'Hidden Inventory 4',
      'Premature Death',
      'It\'s Like That',
      'Evening Festival',
      'Shibuya Incident',
      'Shibuya Incident - Gate Open',
      'Pandemonium',
      'Seance',
      'Dull Knife',
      'Red Scale',
      'Fluctuations',
      'Fluctuations, Part 2',
      'Right and Wrong',
      'Right and Wrong, Part 2',
      'Right and Wrong, Part 3',
      'Thunderclap',
      'Thunderclap, Part 2',
      'Metamorphosis',
      'Metamorphosis, Part 2',
      'Shibuya Incident - Gate Close',
    ],
  };

  const animeEpNames = titles[title];
  if (animeEpNames && animeEpNames[index - 1]) {
    return animeEpNames[index - 1];
  }
  return `The Adventure Begins (Part ${index})`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
