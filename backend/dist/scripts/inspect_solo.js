"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const anime = await prisma.anime.findFirst({
        where: {
            OR: [
                { title: { contains: 'Solo Leveling' } },
                { slug: { contains: 'solo-leveling' } }
            ]
        },
        include: {
            episodes: true
        }
    });
    if (!anime) {
        console.log('Solo Leveling not found in DB');
        return;
    }
    console.log('Anime:', {
        id: anime.id,
        title: anime.title,
        slug: anime.slug,
        malId: anime.malId,
        hasDub: anime.hasDub,
        hasHindi: anime.hasHindi,
        episodesCount: anime.episodes.length
    });
    if (anime.episodes.length > 0) {
        console.log('Episode 1:', anime.episodes[0]);
    }
}
main().finally(() => prisma.$disconnect());
