"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const titles = [
        'Paihame Kazoku',
        'Chimimonryou',
        'Kyonyuu ga Futari Inai to Bokki Shinai Otto no Tame ni Tomodachi wo Tsuretekita Tsuma',
        'Otaku no Boku ga Ichigun Gal to Tsukiaeru made no Hanashi',
        'Hebi to Kumo',
        'Anal Mania Otaku to Ananii Daisuki na Ojou-sama',
        'Phantom Alchemia',
        'Lamour fou de l automate',
        'Mou Ichido Shite Mitai',
        'Kenki Virgo',
        'Seikou Senki Pony Celes',
        'Seifuku wa Kita mama de',
        'Cool de M',
        'Seihou Shouka Saint Lime',
        'Kegareboshi',
        'Natsu to Hako',
        'Do S na Pet',
        'Oshikake! Bakunyuu Gyaru Harem Seikatsu',
        'Nagachichi Nagai-san',
        'Mesu o Karu Mura',
        'Seikon no Aria',
        'Choro Mesu Days',
        'Honey Blonde 2',
        'Reika wa Karei na Boku no Joou',
        'H na Gishi Series'
    ];
    const found = await prisma.anime.findMany({
        where: {
            OR: titles.map(t => ({ title: { contains: t } }))
        },
        select: { id: true, title: true, slug: true, hasDub: true, hasSub: true, rating: true, genres: true }
    });
    console.log('Found custom/hentai titles count:', found.length);
    console.log(found);
}
main().finally(() => prisma.$disconnect());
