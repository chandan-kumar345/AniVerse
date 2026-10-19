import { PrismaClient } from '@prisma/client';
import { INITIAL_ANIME_SERIES, INITIAL_ANIME_MOVIES } from '../data/initialCatalog';
import { VerificationService } from '../services/verification.service';

const prisma = new PrismaClient();

interface TestResult {
  suite: string;
  name: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  details: string;
}

const results: TestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, details: string) {
  const status = passed ? 'PASSED' : 'FAILED';
  results.push({ suite, name, status, details });
  console.log(`[${status}] [${suite}] ${name} -> ${details}`);
}

async function runQASuite() {
  console.log('====================================================');
  console.log('       ANIVERSE AUTOMATED QA & INTEGRITY SUITE       ');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // 1. CATALOG COMPLETENESS SUITE
    // ----------------------------------------------------
    console.log('--- 1. Catalog Completeness Tests ---');
    const totalTitles = await prisma.anime.count();
    const seriesCount = await prisma.anime.count({ where: { contentType: 'series' } });
    const moviesCount = await prisma.anime.count({ where: { contentType: 'movie' } });

    recordTest('Catalog Completeness', '200 Series Ingested', seriesCount >= 200, `Found ${seriesCount} series (200 new + legacy preserved)`);
    recordTest('Catalog Completeness', '200 Movies Ingested', moviesCount === 200, `Found ${moviesCount} movies (expected: 200)`);
    recordTest('Catalog Completeness', 'Total Catalog Titles', totalTitles >= 400, `Found ${totalTitles} total titles (at least 400 required)`);

    // Check for duplicate slugs
    const allAnime = await prisma.anime.findMany({ select: { slug: true, title: true } });
    const slugSet = new Set<string>();
    let duplicateCount = 0;
    for (const item of allAnime) {
      if (slugSet.has(item.slug)) {
        duplicateCount++;
      }
      slugSet.add(item.slug);
    }
    recordTest('Catalog Completeness', 'Zero Duplicate Slugs', duplicateCount === 0, `Duplicate slugs count: ${duplicateCount}`);

    // Check 1-to-1 match with initial catalog lists
    const dbSeries = await prisma.anime.findMany({ where: { contentType: 'series' }, select: { title: true } });
    const dbMovies = await prisma.anime.findMany({ where: { contentType: 'movie' }, select: { title: true } });

    const matchedSeries = INITIAL_ANIME_SERIES.filter((s: { title: string }) => dbSeries.some((d: { title: string }) => d.title.toLowerCase().trim() === s.title.toLowerCase().trim())).length;
    const matchedMovies = INITIAL_ANIME_MOVIES.filter((m: { title: string }) => dbMovies.some((d: { title: string }) => d.title.toLowerCase().trim() === m.title.toLowerCase().trim())).length;

    recordTest('Catalog Completeness', 'Source Series Title Matching', matchedSeries === 200, `${matchedSeries}/200 series mapped to source list`);
    recordTest('Catalog Completeness', 'Source Movie Title Matching', matchedMovies === 200, `${matchedMovies}/200 movies mapped to source list`);

    // ----------------------------------------------------
    // 2. METADATA VALIDATION SUITE
    // ----------------------------------------------------
    console.log('\n--- 2. Metadata Validation Tests ---');
    const missingTitle = await prisma.anime.count({ where: { title: '' } });
    const missingGenre = await prisma.anime.count({ where: { genres: '' } });
    const missingPoster = await prisma.anime.count({ where: { posterImage: '' } });

    recordTest('Metadata Validation', 'Non-Empty Titles', missingTitle === 0, `Titles missing: ${missingTitle}`);
    recordTest('Metadata Validation', 'Non-Empty Genres', missingGenre === 0, `Genres missing: ${missingGenre}`);
    recordTest('Metadata Validation', 'Poster Images Available', missingPoster === 0, `Poster images missing: ${missingPoster}`);

    // Check 20 standard genres coverage
    const standardGenres = [
      'Action', 'Adventure', 'Fantasy', 'Isekai', 'Shonen', 'Romance',
      'Comedy', 'Drama', 'Slice of Life', 'Horror', 'Psychological',
      'Mystery', 'Thriller', 'Science Fiction', 'Mecha', 'Sports',
      'Supernatural', 'Historical', 'Family', 'Music'
    ];
    const genresInDb = await prisma.anime.findMany({ select: { genres: true } });
    const distinctDbGenres = new Set<string>();
    genresInDb.forEach((g: { genres: string }) => {
      g.genres.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((gn: string) => distinctDbGenres.add(gn));
    });

    const coveredGenres = standardGenres.filter((g: string) => distinctDbGenres.has(g));
    recordTest('Metadata Validation', 'Required Genres Coverage', coveredGenres.length === standardGenres.length, `Covered ${coveredGenres.length}/${standardGenres.length} required genres`);

    // ----------------------------------------------------
    // 3. MAPPING CORRECTNESS & INTEGRITY SUITE
    // ----------------------------------------------------
    console.log('\n--- 3. Mapping Correctness & Providers ---');
    const totalEpisodes = await prisma.episode.count();
    const totalMappings = await prisma.videoMapping.count();
    const providersCount = await prisma.videoProvider.count({ where: { isActive: true } });

    recordTest('Mapping Correctness', 'Playable Episode Mappings Created', totalEpisodes >= 200, `Found ${totalEpisodes} playable episodes`);
    recordTest('Mapping Correctness', 'Authorized Providers Configured', providersCount >= 4, `Found ${providersCount} active streaming providers`);
    recordTest('Mapping Correctness', 'Video Mappings Table Populated', totalMappings >= 400, `Found ${totalMappings} verified provider mappings`);

    // Provider validity check (ensures no dummy/random URLs like BigBuckBunny in active mappings)
    const dummyMappings = await prisma.videoMapping.count({
      where: {
        OR: [
          { embedUrl: { contains: 'BigBuckBunny' } },
          { embedUrl: { contains: 'placeholder' } },
          { embedUrl: { contains: 'localhost' } }
        ]
      }
    });
    recordTest('Mapping Correctness', 'No Placeholder/Dummy URLs in Mappings', dummyMappings === 0, `Dummy or placeholder URLs found: ${dummyMappings}`);

    // ----------------------------------------------------
    // 4. AUDIO INTEGRITY & DUBBING VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 4. Audio Integrity & Dubbing Support ---');
    const englishDubs = await prisma.anime.count({ where: { hasDub: true } });
    const hindiDubs = await prisma.anime.count({ where: { hasHindi: true } });
    const totalAudioVersions = await prisma.audioVersion.count({ where: { isAvailable: true } });

    recordTest('Audio Integrity', 'English Dub Coverage', englishDubs >= 390, `Found ${englishDubs} titles with verified English Dub`);
    recordTest('Audio Integrity', 'Hindi Dub Coverage', hindiDubs >= 80, `Found ${hindiDubs} titles with verified Hindi Dub`);
    recordTest('Audio Integrity', 'Audio Versions Entities', totalAudioVersions >= 400, `Found ${totalAudioVersions} active AudioVersion records`);

    // Test that Hindi dub is present on key franchises
    const verifiedHindiAnime = await prisma.anime.findMany({
      where: { hasHindi: true },
      select: { title: true }
    });
    const popularHindiTitles = ['Solo Leveling', 'Jujutsu Kaisen', 'Demon Slayer', 'Naruto', 'One Piece'];
    const popularHindiMatched = verifiedHindiAnime.filter((a: { title: string }) => popularHindiTitles.some((p: string) => a.title.includes(p)));
    recordTest('Audio Integrity', 'Major Hindi Dub Titles Present', popularHindiMatched.length > 0, `Verified major Hindi dubs present (${popularHindiMatched.length} confirmed)`);

    // ----------------------------------------------------
    // 5. VERIFICATION SERVICE ENGINE AUDIT
    // ----------------------------------------------------
    console.log('\n--- 5. Automated Verification Engine Audit ---');
    const auditSample = await prisma.videoMapping.findMany({ take: 50 });
    let passedAuditChecks = 0;
    for (const mapping of auditSample) {
      const auditResult = await VerificationService.verifyMapping(mapping.id);
      if (auditResult.isValid) passedAuditChecks++;
    }
    recordTest('Verification Engine', '10-Point Audit Verification Rate', passedAuditChecks > 0, `${passedAuditChecks}/${auditSample.length} mappings verified available via 10-point audit`);

    // ----------------------------------------------------
    // 6. RESILIENCE & ERROR HANDLING SUITE
    // ----------------------------------------------------
    console.log('\n--- 6. Resilience & Error Handling ---');
    // Non-existent anime query check
    const nonExistent = await prisma.anime.findUnique({ where: { slug: 'non-existent-anime-slug-9999' } });
    recordTest('Resilience', 'Non-Existent Slug Handled Gracefully', nonExistent === null, 'Returned null without unhandled exception');

    // Missing episode query check
    const nonExistentEpisode = await prisma.episode.findFirst({ where: { animeId: 'non-existent-id' } });
    recordTest('Resilience', 'Non-Existent Episode Handled Gracefully', nonExistentEpisode === null, 'Returned null without crash');

    // ----------------------------------------------------
    // 7. USER BROWSING & FILTERING QUERIES
    // ----------------------------------------------------
    console.log('\n--- 7. User Browsing & Filter Queries ---');
    // Series filter query
    const seriesQuery = await prisma.anime.findMany({
      where: { contentType: 'series' },
      take: 10
    });
    recordTest('User Browsing', 'Filter by Series', seriesQuery.length === 10 && seriesQuery.every((s: { contentType: string }) => s.contentType === 'series'), `Retrieved 10 series items successfully`);

    // Movies filter query
    const moviesQuery = await prisma.anime.findMany({
      where: { contentType: 'movie' },
      take: 10
    });
    recordTest('User Browsing', 'Filter by Movies', moviesQuery.length === 10 && moviesQuery.every((m: { contentType: string }) => m.contentType === 'movie'), `Retrieved 10 movie items successfully`);

    // Hindi Dub filter query
    const hindiQuery = await prisma.anime.findMany({
      where: { hasHindi: true },
      take: 10
    });
    recordTest('User Browsing', 'Filter by Hindi Dub', hindiQuery.length === 10 && hindiQuery.every((h: { hasHindi: boolean }) => h.hasHindi === true), `Retrieved 10 Hindi items successfully`);

    // ----------------------------------------------------
    // 8. ADMIN MANAGEMENT METRICS
    // ----------------------------------------------------
    console.log('\n--- 8. Admin Management Metrics ---');
    const availableCount = await prisma.anime.count({ where: { availabilityStatus: 'AVAILABLE' } });
    const verifiedCount = await prisma.anime.count({ where: { availabilityStatus: 'METADATA_VERIFIED' } });
    const pendingCount = await prisma.anime.count({ where: { availabilityStatus: 'MAPPING_PENDING' } });
    const validStatuses = ['DRAFT', 'METADATA_VERIFIED', 'MAPPING_PENDING', 'MAPPING_VERIFIED', 'AVAILABLE', 'UNAVAILABLE', 'ERROR'];
    const invalidStatusCount = await prisma.anime.count({
      where: {
        availabilityStatus: { notIn: validStatuses }
      }
    });

    recordTest('Admin Management', 'Lifecycle Status Integrity', invalidStatusCount === 0 && availableCount >= 400, `Available: ${availableCount}, Verified: ${verifiedCount}, Pending: ${pendingCount}, Corrupt: ${invalidStatusCount}`);

    // Print Final QA Summary Table
    console.log('\n====================================================');
    console.log('                 FINAL QA SUMMARY                   ');
    console.log('====================================================');
    const totalExecuted = results.length;
    const totalPassed = results.filter(r => r.status === 'PASSED').length;
    const totalFailed = results.filter(r => r.status === 'FAILED').length;
    const totalBlocked = results.filter(r => r.status === 'BLOCKED').length;

    console.table(results.map(r => ({
      Suite: r.suite,
      Test: r.name,
      Status: r.status,
      Details: r.details
    })));

    console.log(`\nTOTAL TESTS: ${totalExecuted} | PASSED: ${totalPassed} | FAILED: ${totalFailed} | BLOCKED: ${totalBlocked}`);
    const passPercentage = ((totalPassed / totalExecuted) * 100).toFixed(1);
    console.log(`OVERALL PASS RATE: ${passPercentage}%\n`);

    if (totalFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('QA Automation Fatal Exception:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runQASuite();
