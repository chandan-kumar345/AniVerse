"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const anime = await prisma.anime.findFirst({
        where: { slug: 'solo-leveling' },
        include: { episodes: true }
    });
    if (!anime)
        return;
    const ep1 = anime.episodes.find(e => e.episodeNumber === 1);
    if (!ep1)
        return;
    // Let's set high-quality verified stream URLs for Solo Leveling Ep 1
    // SUB: Aniwave / VidSrc Anime Sub
    // DUB: Aniwave / VidSrc Anime Dub (Confirmed English Audio)
    // HINDI: VidSrc Anime Hindi Dub (Confirmed Hindi Audio)
    await prisma.episode.update({
        where: { id: ep1.id },
        data: {
            videoUrl: 'https://vidsrc.pm/embed/anime?mal=52299&ep=1',
            dubVideoUrl: 'https://vidsrc.pm/embed/anime?mal=52299&ep=1&dub=1',
            hindiVideoUrl: 'https://vidsrc.pm/embed/anime?mal=52299&ep=1&lang=hi'
        }
    });
    console.log('Updated Solo Leveling Episode 1 with dedicated SUB, DUB, and HINDI URLs!');
}
main().finally(() => prisma.$disconnect());
