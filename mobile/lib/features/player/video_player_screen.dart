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

  @override
  void initState() {
    super.initState();
    _currentEpNum = widget.epNum;
    _initStream();
  }

  @override
  void dispose() {
    _videoPlayerController?.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  Future<void> _initStream() async {
    setState(() => _isLoading = true);

    try {
      final repo = ref.read(animeRepositoryProvider);
      final sources = await repo.getEpisodeSources(
        widget.slug,
        _currentEpNum,
        server: _activeServer,
        lang: _activeAudio,
      );

      _sourcesResponse = sources;
      _activeServer = sources.server;

      final url = sources.embedUrl;
      final isDirect = url.isNotEmpty &&
          (url.endsWith('.mp4') ||
              url.endsWith('.m3u8') ||
              url.contains('.mp4?') ||
              url.contains('.m3u8?'));

      if (isDirect) {
        _isDirectVideo = true;
        _initNativeVideoPlayer(url);
      } else {
        _isDirectVideo = false;
        _initWebViewPlayer(url.isNotEmpty ? url : 'https://vidsrc.pm/embed/anime?mal=52299&ep=$_currentEpNum');
      }
    } catch (_) {
      // Resilient fallback to auto-embed
      _isDirectVideo = false;
      _initWebViewPlayer('https://vidsrc.pm/embed/anime?mal=52299&ep=$_currentEpNum');
    }
  }

  void _initNativeVideoPlayer(String directUrl) {
    _videoPlayerController?.dispose();
    _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(directUrl))
      ..initialize().then((_) {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _videoPlayerController?.play();
          });
        }
      }).catchError((_) {
        // Fallback to webview player if direct media fails to decode
        if (mounted) {
          _isDirectVideo = false;
          _initWebViewPlayer('https://vidsrc.pm/embed/anime?mal=52299&ep=$_currentEpNum');
        }
      });
  }

  void _initWebViewPlayer(String embedUrl) {
    _videoPlayerController?.dispose();
    _videoPlayerController = null;

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            final uri = Uri.tryParse(request.url);
            if (uri != null && (uri.scheme == 'http' || uri.scheme == 'https')) {
              final host = uri.host.toLowerCase();
              // Prevent common popunder and intrusive ad domains
              if (host.contains('doubleclick') ||
                  host.contains('googleads') ||
                  host.contains('adsterra') ||
                  host.contains('popads') ||
                  host.contains('bet') ||
                  host.contains('casino') ||
                  host.contains('exoclick') ||
                  host.contains('onclick')) {
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
              setState(() => _isLoading = false);
              // Inject CSS to ensure player fits 100% viewport and removes background padding
              _webViewController?.runJavaScript('''
                (function() {
                  var style = document.createElement('style');
                  style.innerHTML = 'body, html { margin:0; padding:0; width:100%; height:100%; background:#000; overflow:hidden; } iframe, video { width:100% !important; height:100% !important; border:none !important; }';
                  document.head.appendChild(style);
                })();
              ''');
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(embedUrl));

    setState(() {
      _webViewController = controller;
    });
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
    });
    _initStream();
  }

  void _openServerPicker() {
    final servers = _sourcesResponse?.servers ?? [];
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
                      'Select Streaming Mirror',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ],
                ),
              ),
              const Divider(color: Color(0xFF1E2130), height: 1),
              if (servers.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('Primary Server active', style: TextStyle(color: Colors.white70)),
                )
              else
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: servers.length,
                    separatorBuilder: (_, _) => const Divider(color: Color(0xFF181A29), height: 1),
                    itemBuilder: (context, index) {
                      final s = servers[index];
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
                          'Episode $_currentEpNum • ${_activeAudio.toUpperCase()}',
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

            // Video Player Viewport (Dual Engine: WebView or Native Video Player)
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
                      color: Colors.black.withValues(alpha: 0.7),
                      child: const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(color: Color(0xFFFF1E56), strokeWidth: 3),
                            SizedBox(height: 16),
                            Text(
                              'Connecting to High-Speed Anime Stream...',
                              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                            ),
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
