"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // 1. Find all mature / 18+ titles that currently have hasDub = true
    const matureTitles = await prisma.anime.findMany({
        where: {
            AND: [
                { hasDub: true },
                {
                    OR: [
                        { rating: '18+' },
                        { rating: 'Rx' },
                        { rating: 'R+' },
                        { genres: { contains: '18+' } },
                        { genres: { contains: 'Hentai' } },
                        { genres: { contains: 'Mature' } }
                    ]
                }
            ]
        },
        select: { id: true, title: true, rating: true, genres: true }
    });
    console.log(`Found ${matureTitles.length} mature titles with hasDub = true.`);
    // 2. Set hasDub = false for these titles
    const updateResult = await prisma.anime.updateMany({
        where: {
            id: { in: matureTitles.map(t => t.id) }
        },
        data: {
            hasDub: false
        }
    });
    console.log(`Updated ${updateResult.count} mature titles to hasDub = false.`);
    // 3. Check total dub vs sub count now
    const hasDubTrue = await prisma.anime.count({ where: { hasDub: true } });
    const hasDubFalse = await prisma.anime.count({ where: { hasDub: false } });
    console.log({ hasDubTrue, hasDubFalse });
}
main().finally(() => prisma.$disconnect());
