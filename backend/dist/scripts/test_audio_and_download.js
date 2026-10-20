"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const anime_controller_1 = require("../controllers/anime.controller");
const prisma = new client_1.PrismaClient();
async function main() {
    const solo = await prisma.anime.findFirst({
        where: { slug: 'solo-leveling' },
        include: { episodes: true }
    });
    if (!solo) {
        console.log('Solo Leveling not found');
        return;
    }
    const createMockReqRes = (params, query) => {
        let statusCode = 200;
        let jsonResult = null;
        const req = { params, query };
        const res = {
            status(code) {
                statusCode = code;
                return this;
            },
            json(data) {
                jsonResult = data;
                return this;
            }
        };
        return { req, res, getResult: () => ({ statusCode, jsonResult }) };
    };
    console.log('--- TEST SOLO LEVELING AUDIO STREAMING ---');
    // 1. DUB
    const dubTest = createMockReqRes({ id: 'solo-leveling', epNum: '1' }, { lang: 'dub' });
    await (0, anime_controller_1.getEpisodeSources)(dubTest.req, dubTest.res);
    const dubRes = dubTest.getResult().jsonResult;
    console.log('\n[DUB Response]');
    console.log('Active Lang:', dubRes.lang);
    console.log('Active Server:', dubRes.server);
    console.log('Active Embed URL:', dubRes.embedUrl);
    console.log('Available DUB Servers count:', dubRes.servers.length);
    // 2. HINDI
    const hindiTest = createMockReqRes({ id: 'solo-leveling', epNum: '1' }, { lang: 'hindi' });
    await (0, anime_controller_1.getEpisodeSources)(hindiTest.req, hindiTest.res);
    const hindiRes = hindiTest.getResult().jsonResult;
    console.log('\n[HINDI Response]');
    console.log('Active Lang:', hindiRes.lang);
    console.log('Active Server:', hindiRes.server);
    console.log('Active Embed URL:', hindiRes.embedUrl);
    console.log('Available HINDI Servers count:', hindiRes.servers.length);
    // 3. SUB
    const subTest = createMockReqRes({ id: 'solo-leveling', epNum: '1' }, { lang: 'sub' });
    await (0, anime_controller_1.getEpisodeSources)(subTest.req, subTest.res);
    const subRes = subTest.getResult().jsonResult;
    console.log('\n[SUB Response]');
    console.log('Active Lang:', subRes.lang);
    console.log('Active Server:', subRes.server);
    console.log('Active Embed URL:', subRes.embedUrl);
    console.log('Available SUB Servers count:', subRes.servers.length);
    // 4. Download DUB
    const dlTest = createMockReqRes({ id: 'solo-leveling', epNum: '1' }, { lang: 'dub' });
    await (0, anime_controller_1.downloadEpisode)(dlTest.req, dlTest.res);
    const dlRes = dlTest.getResult().jsonResult;
    console.log('\n[Download DUB Response]:', dlRes);
}
main().finally(() => prisma.$disconnect());
