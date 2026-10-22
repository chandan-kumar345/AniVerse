import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:video_player/video_player.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/providers/app_providers.dart';
import '../../data/models/anime_model.dart';

class VideoPlayerScreen extends ConsumerStatefulWidget {
  const VideoPlayerScreen({
    super.key,
    required this.slug,
    required this.epNum,
  });

  final String slug;
  final int epNum;

  @override
  ConsumerState<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends ConsumerState<VideoPlayerScreen> {
  WebViewController? _webViewController;
  VideoPlayerController? _videoPlayerController;

  EpisodeSourcesResponse? _sourcesResponse;
  bool _isLoading = true;
  bool _isDirectVideo = false;
  bool _isLandscape = false;
  String _activeServer = 'vidsrc';
  String _activeAudio = 'sub';
  late int _currentEpNum;
  int _serverFailCount = 0;
  Timer? _slowLoadingTimer;
  bool _showSlowLoadingPrompt = false;

  static const List<String> _serverCycleOrder = [
    'vidsrc',     // HD-1: AniVerse Multi (vidsrc.pm)
    'vidsrc_io',  // HD-2: AniVerse Cloud (vidsrc.io)
    'vidsrc_to',  // HD-3: AniVerse Ultra (vidsrc.to)
    'autoembed',  // HD-4: AniVerse Cinema (autoembed.co)
    'aniwave',    // HD-5: AniVerse Prime (aniwaves.ru)
  ];

  static const Map<String, int> _knownMalIds = {
    // Bleach franchise (specific parts first)
    'bleach-thousand-year-blood-war-the-calamity': 60636,
    'bleach-thousand-year-blood-war-the-conflict': 56206,
    'bleach-thousand-year-blood-war-the-separation': 53998,
    'bleach-thousand-year-blood-war': 41467,
    'bleach-hell-verse': 8247,
    'bleach-fade-to-black': 4835,
    'bleach-the-diamonddust-rebellion': 2889,
    'bleach-memories-of-nobody': 1686,
    'bleach': 269,

    // Naruto franchise
    'boruto-naruto-next-generations': 34566,
    'boruto': 34566,
    'naruto-shippuden': 1735,
    'naruto': 20,

    // Demon Slayer franchise
    'demon-slayer-kimetsu-no-yaiba-the-movie-mugen-train': 40456,
    'demon-slayer-entertainment-district-arc': 47778,
    'demon-slayer-swordsmith-village-arc': 51019,
    'demon-slayer-hashira-training-arc': 55701,
    'demon-slayer-kimetsu-no-yaiba': 38000,
    'demon-slayer': 38000,

    // Jujutsu Kaisen
    'jujutsu-kaisen-0': 48561,
    'jujutsu-kaisen-season-2': 51009,
    'jujutsu-kaisen': 40748,

    // Attack on Titan
    'attack-on-titan-season-2': 25777,
    'attack-on-titan-season-3': 35760,
    'attack-on-titan-the-final-season': 40028,
    'attack-on-titan': 16498,

    // My Hero Academia
    'my-hero-academia-season-2': 33486,
    'my-hero-academia-season-3': 36456,
    'my-hero-academia-season-4': 38408,
    'my-hero-academia-season-5': 41587,
    'my-hero-academia-season-6': 49918,
    'my-hero-academia-season-7': 55894,
    'my-hero-academia': 31964,

    // Dragon Ball
    'dragon-ball-z': 813,
    'dragon-ball-super': 30694,
    'dragon-ball-gt': 225,
    'dragon-ball': 223,

    // Other popular series
    'one-piece': 21,
    'solo-leveling': 52299,
    'chainsaw-man': 44511,
    'death-note': 1535,
    'hunter-x-hunter-2011': 11061,
    'hunter-x-hunter': 11061,
    'frieren-beyond-journeys-end': 52991,
    'blue-lock-season-2': 54865,
    'blue-lock': 49596,
    'dandadan': 57334,
    'kaiju-no-8': 52588,
    'wind-breaker': 54900,
    'black-clover': 34572,
    'vinland-saga': 37521,
    'spy-x-family': 50265,
    'tokyo-ghoul': 22319,
    'haikyuu': 20583,
    'classroom-of-the-elite': 35507,
    'mushoku-tensei-jobless-reincarnation': 39535,
    're-zero-starting-life-in-another-world': 31240,
    'dr-stone': 38691,
    'that-time-i-got-reincarnated-as-a-slime': 37430,
    'hells-paradise': 46569,
    'oshi-no-ko': 52034,
    'fullmetal-alchemist-brotherhood': 5114,
    'one-punch-man': 30276,
    'sword-art-online': 11757,
  };

  @override
  void initState() {
    super.initState();
    _currentEpNum = widget.epNum;
    _initStream();
  }

  @override
  void dispose() {
    _slowLoadingTimer?.cancel();
    _videoPlayerController?.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  int _resolveMalId() {
    final clean = widget.slug.toLowerCase().trim();
    if (_knownMalIds.containsKey(clean)) {
      return _knownMalIds[clean]!;
    }
    // Match longest key first to avoid sub-string collisions
    final sortedEntries = _knownMalIds.entries.toList()
      ..sort((a, b) => b.key.length.compareTo(a.key.length));

    for (final entry in sortedEntries) {
      if (clean.contains(entry.key)) {
        return entry.value;
      }
    }
    // Fallback MAL ID for anime streaming if unknown
    return 52299;
  }

  String _buildFallbackUrl(String server) {
    final malId = _resolveMalId();
    final isDub = _activeAudio == 'dub';
    final isHindi = _activeAudio == 'hindi';

    switch (server) {
      case 'vidsrc_io':
        return 'https://vidsrc.io/embed/anime?mal=$malId&ep=$_currentEpNum${isDub ? '&dub=1' : (isHindi ? '&lang=hi' : '')}';
      case 'vidsrc_to':
        return 'https://vidsrc.to/embed/anime/$malId/$_currentEpNum';
      case 'autoembed':
        return 'https://autoembed.co/anime/$malId/$_currentEpNum';
      case 'aniwave':
        return 'https://aniwaves.ru/watch/${widget.slug}/ep-$_currentEpNum?lang=$_activeAudio';
      case 'vidsrc':
      default:
        return 'https://vidsrc.pm/embed/anime?mal=$malId&ep=$_currentEpNum${isDub ? '&dub=1' : (isHindi ? '&lang=hi' : '')}';
    }
  }

  Future<void> _initStream() async {
    setState(() {
      _isLoading = true;
      _showSlowLoadingPrompt = false;
    });

    _slowLoadingTimer?.cancel();
    _slowLoadingTimer = Timer(const Duration(seconds: 6), () {
      if (mounted && _isLoading) {
        setState(() {
          _showSlowLoadingPrompt = true;
        });
      }
    });

    String targetUrl = '';

    try {
      final repo = ref.read(animeRepositoryProvider);
      final sources = await repo.getEpisodeSources(
        widget.slug,
        _currentEpNum,
        server: _activeServer,
        lang: _activeAudio,
      ).timeout(const Duration(seconds: 4));

      _sourcesResponse = sources;
      _activeServer = sources.server;
      targetUrl = sources.embedUrl;
    } catch (_) {
      // Backend offline, slow or sleeping: resolve resilient direct stream immediately
      targetUrl = _buildFallbackUrl(_activeServer);
    }

    if (targetUrl.isEmpty) {
      targetUrl = _buildFallbackUrl(_activeServer);
    }

    final isDirect = targetUrl.endsWith('.mp4') ||
        targetUrl.endsWith('.m3u8') ||
        targetUrl.contains('.mp4?') ||
        targetUrl.contains('.m3u8?');

    if (isDirect) {
      _isDirectVideo = true;
      _initNativeVideoPlayer(targetUrl);
    } else {
      _isDirectVideo = false;
      _initWebViewPlayer(targetUrl);
    }
  }

  void _initNativeVideoPlayer(String directUrl) {
    _videoPlayerController?.dispose();
    _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(directUrl))
      ..initialize().then((_) {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _showSlowLoadingPrompt = false;
            _videoPlayerController?.play();
          });
        }
      }).catchError((_) {
        if (mounted) {
          _isDirectVideo = false;
          _initWebViewPlayer(_buildFallbackUrl(_activeServer));
        }
      });
  }

  void _initWebViewPlayer(String embedUrl) {
    _videoPlayerController?.dispose();
    _videoPlayerController = null;

    final htmlWrapper = '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#000; overflow:hidden; }
    iframe { width:100%; height:100%; border:none; position:absolute; top:0; left:0; right:0; bottom:0; }
  </style>
</head>
<body>
  <iframe
    id="aniverse-stream"
    src="$embedUrl"
    allowfullscreen="true"
    webkitallowfullscreen="true"
    mozallowfullscreen="true"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    referrerpolicy="no-referrer">
  </iframe>
</body>
</html>
''';

    String? origin;
    try {
      final uri = Uri.parse(embedUrl);
      if (uri.hasScheme && uri.host.isNotEmpty) {
        origin = '${uri.scheme}://${uri.host}';
      }
    } catch (_) {}

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            final lower = request.url.toLowerCase();

            // Always allow data:, blob:, about:blank, and player schemas
            if (lower.startsWith('about:blank') ||
                lower.startsWith('data:') ||
                lower.startsWith('blob:') ||
                lower.startsWith('javascript:')) {
              return NavigationDecision.navigate;
            }

            final uri = Uri.tryParse(request.url);
            if (uri != null && (uri.scheme == 'http' || uri.scheme == 'https')) {
              final host = uri.host.toLowerCase();
              // Deflect malicious ads & popunder networks
              if (host.contains('doubleclick') ||
                  host.contains('googleads') ||
                  host.contains('adsterra') ||
                  host.contains('popads') ||
                  host.contains('bet') ||
                  host.contains('casino') ||
                  host.contains('exoclick') ||
                  host.contains('onclick') ||
                  host.contains('propeller')) {
                return NavigationDecision.prevent;
              }
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _showSlowLoadingPrompt = false;
              });
              _webViewController?.runJavaScript('''
                (function() {
                  var style = document.createElement('style');
                  style.innerHTML = 'body, html { margin:0; padding:0; width:100%; height:100%; background:#000; overflow:hidden; } iframe { width:100% !important; height:100% !important; border:none !important; }';
                  document.head.appendChild(style);
                })();
              ''');
            }
          },
          onWebResourceError: (WebResourceError error) {
            // Ignore sub-resource and ad script failures to avoid interrupting video streams
          },
        ),
      )
      ..loadHtmlString(htmlWrapper, baseUrl: origin ?? 'https://vidsrc.pm');

    setState(() {
      _webViewController = controller;
    });
  }

  void _tryNextServer() {
    _serverFailCount++;
    final currentIndex = _serverCycleOrder.indexOf(_activeServer);
    final nextIndex = (currentIndex + 1) % _serverCycleOrder.length;
    final nextServer = _serverCycleOrder[nextIndex];

    if (mounted) {
      setState(() {
        _activeServer = nextServer;
      });
      _initStream();
    }
  }

  void _toggleOrientation() {
    setState(() => _isLandscape = !_isLandscape);
    if (_isLandscape) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    } else {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);
    }
  }

  void _changeEpisode(int newEp) {
    if (newEp < 1) return;
    setState(() {
      _currentEpNum = newEp;
      _serverFailCount = 0;
    });
    _initStream();
  }

  void _openServerPicker() {
    final availableServers = _sourcesResponse?.servers ?? [];
    final displayServers = availableServers.isNotEmpty
        ? availableServers
        : [
            StreamSourceModel(id: 'vidsrc', name: 'HD-1: AniVerse Multi (Primary)', embedUrl: ''),
            StreamSourceModel(id: 'aniwave', name: 'HD-2: AniVerse Prime (High Speed)', embedUrl: ''),
            StreamSourceModel(id: 'vidsrc_me', name: 'HD-3: AniVerse Global', embedUrl: ''),
            StreamSourceModel(id: 'autoembed', name: 'HD-4: AniVerse Auto', embedUrl: ''),
            StreamSourceModel(id: 'vidsrc_cc', name: 'HD-5: AniVerse Cinema', embedUrl: ''),
            StreamSourceModel(id: 'vidsrc_io', name: 'HD-6: AniVerse Cloud', embedUrl: ''),
          ];

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF131524),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Icon(Icons.dns_rounded, color: Color(0xFFFF1E56), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Select Video Streaming Mirror',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ],
                ),
              ),
              const Divider(color: Color(0xFF1E2130), height: 1),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: displayServers.length,
                  separatorBuilder: (_, _) => const Divider(color: Color(0xFF181A29), height: 1),
                  itemBuilder: (context, index) {
                    final s = displayServers[index];
                    final isSelected = s.id == _activeServer;
                    return ListTile(
                      leading: Icon(
                        Icons.play_circle_fill_rounded,
                        color: isSelected ? const Color(0xFFFF1E56) : const Color(0xFF64748B),
                      ),
                      title: Text(
                        s.name,
                        style: TextStyle(
                          color: isSelected ? const Color(0xFFFF1E56) : Colors.white,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                          fontSize: 13.5,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check_rounded, color: Color(0xFFFF1E56), size: 20)
                          : null,
                      onTap: () {
                        Navigator.pop(context);
                        setState(() => _activeServer = s.id);
                        _initStream();
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openAudioPicker() {
    final audios = ['sub', 'dub', 'hindi'];
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF131524),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Icon(Icons.graphic_eq_rounded, color: Color(0xFFFF1E56), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Audio Track & Subtitles',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ],
                ),
              ),
              const Divider(color: Color(0xFF1E2130), height: 1),
              ...audios.map((lang) {
                final isSelected = _activeAudio == lang;
                final label = lang == 'sub'
                    ? 'Japanese (Subtitles)'
                    : (lang == 'dub' ? 'English Dubbed' : 'Hindi Dubbed');
                return ListTile(
                  leading: Icon(
                    Icons.audiotrack_rounded,
                    color: isSelected ? const Color(0xFFFF1E56) : const Color(0xFF64748B),
                  ),
                  title: Text(
                    label,
                    style: TextStyle(
                      color: isSelected ? const Color(0xFFFF1E56) : Colors.white,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_rounded, color: Color(0xFFFF1E56), size: 20)
                      : null,
                  onTap: () {
                    Navigator.pop(context);
                    setState(() => _activeAudio = lang);
                    _initStream();
                  },
                );
              }),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.slug.replaceAll('-', ' ').toUpperCase();

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Top App Bar Controls
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              color: const Color(0xFF0D0E15),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Title & Episode Badge
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          'Episode $_currentEpNum • ${_activeAudio.toUpperCase()} • ${_activeServer.toUpperCase()}',
                          style: const TextStyle(
                            color: Color(0xFFFF1E56),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Server Selector Button
                  GestureDetector(
                    onTap: _openServerPicker,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF181A29),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.dns_rounded, color: Color(0xFFFF1E56), size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Server',
                            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Audio Track Button
                  GestureDetector(
                    onTap: _openAudioPicker,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF181A29),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.subtitles_rounded, color: Colors.white70, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            _activeAudio.toUpperCase(),
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Fullscreen/Orientation Toggle
                  GestureDetector(
                    onTap: _toggleOrientation,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _isLandscape ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Video Player Viewport (Dual Engine: Web Iframe or Native Video Player)
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Video Surface
                  if (_isDirectVideo && _videoPlayerController != null && _videoPlayerController!.value.isInitialized)
                    Center(
                      child: AspectRatio(
                        aspectRatio: _videoPlayerController!.value.aspectRatio,
                        child: VideoPlayer(_videoPlayerController!),
                      ),
                    )
                  else if (_webViewController != null)
                    WebViewWidget(controller: _webViewController!)
                  else
                    Container(color: Colors.black),

                  // Loading Shimmer Indicator
                  if (_isLoading)
                    Container(
                      color: Colors.black.withValues(alpha: 0.75),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const CircularProgressIndicator(color: Color(0xFFFF1E56), strokeWidth: 3),
                            const SizedBox(height: 16),
                            const Text(
                              'Connecting to High-Speed Anime Stream...',
                              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                            if (_showSlowLoadingPrompt) ...[
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: _tryNextServer,
                                icon: const Icon(Icons.swap_horiz_rounded, size: 18),
                                label: const Text('Slow? Switch to Backup Mirror'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFFF1E56),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Bottom Quick Episode Navigation Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: const Color(0xFF0D0E15),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Previous Episode
                  TextButton.icon(
                    onPressed: _currentEpNum > 1 ? () => _changeEpisode(_currentEpNum - 1) : null,
                    icon: const Icon(Icons.skip_previous_rounded, size: 20),
                    label: const Text('Prev Ep'),
                    style: TextButton.styleFrom(
                      foregroundColor: _currentEpNum > 1 ? Colors.white : Colors.white24,
                      textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                    ),
                  ),

                  // Center Episode Counter Pill
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF1E56), Color(0xFFBE123C)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFF1E56).withValues(alpha: 0.4),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: Text(
                      'Episode $_currentEpNum',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                    ),
                  ),

                  // Next Episode
                  TextButton.icon(
                    onPressed: () => _changeEpisode(_currentEpNum + 1),
                    icon: const Icon(Icons.skip_next_rounded, size: 20),
                    label: const Text('Next Ep'),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white,
                      textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
