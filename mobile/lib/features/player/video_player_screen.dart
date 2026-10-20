import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:video_player/video_player.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
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
  VideoPlayerController? _controller;
  EpisodeSourcesResponse? _sourcesResponse;
  bool _isLoading = true;
  bool _isPlaying = true;
  bool _showControls = true;
  String _activeServer = 'vidsrc';
  String _activeAudio = 'sub';
  double _playbackSpeed = 1.0;
  String _quality = '1080p';

  @override
  void initState() {
    super.initState();
    _fetchAndInitStream();
  }

  Future<void> _fetchAndInitStream() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(animeRepositoryProvider);
      final sources = await repo.getEpisodeSources(
        widget.slug,
        widget.epNum,
        server: _activeServer,
        lang: _activeAudio,
      );

      _sourcesResponse = sources;
      _activeServer = sources.server;

      // Initialize sample fallback or direct url with video player
      final streamUrl = sources.embedUrl.isNotEmpty
          ? sources.embedUrl
          : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

      _controller?.dispose();
      _controller = VideoPlayerController.networkUrl(Uri.parse(streamUrl))
        ..initialize().then((_) {
          if (mounted) {
            setState(() {
              _isLoading = false;
              _controller?.play();
            });
          }
        }).catchError((_) {
          if (mounted) {
            setState(() => _isLoading = false);
          }
        });
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    super.dispose();
  }

  void _togglePlayPause() {
    if (_controller == null) return;
    setState(() {
      if (_controller!.value.isPlaying) {
        _controller!.pause();
        _isPlaying = false;
      } else {
        _controller!.play();
        _isPlaying = true;
      }
    });
  }

  void _seekBy(int seconds) {
    if (_controller == null) return;
    final current = _controller!.value.position;
    final target = current + Duration(seconds: seconds);
    _controller!.seekTo(target);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Video Player Viewport
            AspectRatio(
              aspectRatio: 16 / 9,
              child: GestureDetector(
                onTap: () => setState(() => _showControls = !_showControls),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (_controller != null && _controller!.value.isInitialized)
                      VideoPlayer(_controller!)
                    else
                      Container(
                        color: Colors.black,
                        child: Center(
                          child: _isLoading
                              ? const CircularProgressIndicator(color: AppColors.primaryNeon)
                              : Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.live_tv_rounded, color: AppColors.primaryNeon, size: 48),
                                    const SizedBox(height: 12),
                                    SafeText(
                                      'Connecting to $_activeServer mirror...',
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                    ),
                                  ],
                                ),
                        ),
                      ),

                    // Controls Overlay (Matching Screen 9 in mockup)
                    if (_showControls) ...[
                      // Dark gradient tint
                      Container(
                        color: Colors.black.withOpacity(0.45),
                      ),

                      // Top Bar: Back, Title, PIP, Cast, Settings
                      Positioned(
                        top: 10,
                        left: 10,
                        right: 10,
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                              onPressed: () => context.pop(),
                            ),
                            Expanded(
                              child: SafeText(
                                '${widget.slug.toUpperCase()} • Ep ${widget.epNum}',
                                maxLines: 1,
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Colors.white),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.cast_rounded, color: Colors.white, size: 20),
                              onPressed: () {},
                            ),
                            IconButton(
                              icon: const Icon(Icons.picture_in_picture_alt_rounded, color: Colors.white, size: 20),
                              onPressed: () {},
                            ),
                          ],
                        ),
                      ),

                      // Center Playback Triggers (-10s, Play/Pause, +10s)
                      Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            IconButton(
                              iconSize: 36,
                              icon: const Icon(Icons.replay_10_rounded, color: Colors.white),
                              onPressed: () => _seekBy(-10),
                            ),
                            const SizedBox(width: 24),
                            GestureDetector(
                              onTap: _togglePlayPause,
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryNeon,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(color: AppColors.primaryGlow, blurRadius: 20),
                                  ],
                                ),
                                child: Icon(
                                  _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                  color: Colors.white,
                                  size: 36,
                                ),
                              ),
                            ),
                            const SizedBox(width: 24),
                            IconButton(
                              iconSize: 36,
                              icon: const Icon(Icons.forward_10_rounded, color: Colors.white),
                              onPressed: () => _seekBy(10),
                            ),
                          ],
                        ),
                      ),

                      // Bottom Progress Slider & Timestamps
                      Positioned(
                        bottom: 0,
                        left: 16,
                        right: 16,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                SafeText(
                                  _formatDuration(_controller?.value.position ?? Duration.zero),
                                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                                SafeText(
                                  _formatDuration(_controller?.value.duration ?? const Duration(minutes: 24)),
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                ),
                              ],
                            ),
                            if (_controller != null && _controller!.value.isInitialized)
                              VideoProgressIndicator(
                                _controller!,
                                allowScrubbing: true,
                                colors: VideoProgressColors(
                                  playedColor: AppColors.primaryNeon,
                                  bufferedColor: Colors.white.withOpacity(0.3),
                                  backgroundColor: Colors.white.withOpacity(0.1),
                                ),
                              ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Secondary Controls Bar (Auto, 1x, 1080p, CC, Mirrors)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: AppColors.surfaceCard,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _controlBadge('Auto', () {}),
                  _controlBadge('${_playbackSpeed}x', _changeSpeed),
                  _controlBadge(_quality, _changeQuality),
                  _controlBadge('CC ${_activeAudio.toUpperCase()}', _changeAudio),
                  IconButton(
                    icon: const Icon(Icons.fullscreen_rounded, color: Colors.white, size: 22),
                    onPressed: () {
                      SystemChrome.setPreferredOrientations([
                        DeviceOrientation.landscapeLeft,
                        DeviceOrientation.landscapeRight,
                      ]);
                    },
                  ),
                ],
              ),
            ),

            // Server Mirror Switcher Section
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const SafeText(
                    'Streaming Mirrors',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  if (_sourcesResponse?.servers.isNotEmpty ?? false)
                    ..._sourcesResponse!.servers.map((s) {
                      final isSelected = _activeServer == s.id;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          tileColor: isSelected ? AppColors.surfaceElevated : AppColors.surfaceCard,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                              color: isSelected ? AppColors.primaryNeon : AppColors.border,
                            ),
                          ),
                          leading: Icon(
                            Icons.play_circle_fill_rounded,
                            color: isSelected ? AppColors.primaryNeon : AppColors.textMuted,
                          ),
                          title: SafeText(
                            s.name,
                            style: TextStyle(
                              color: isSelected ? Colors.white : AppColors.textSecondary,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          trailing: isSelected
                              ? Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryNeon.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const SafeText(
                                    'ACTIVE',
                                    style: TextStyle(color: AppColors.primaryNeon, fontSize: 10, fontWeight: FontWeight.w900),
                                  ),
                                )
                              : null,
                          onTap: () {
                            setState(() => _activeServer = s.id);
                            _fetchAndInitStream();
                          },
                        ),
                      );
                    })
                  else
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: SafeText('Loading available mirrors...', style: TextStyle(color: AppColors.textMuted)),
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

  Widget _controlBadge(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.borderLight, width: 0.5),
        ),
        child: SafeText(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }

  void _changeSpeed() {
    final speeds = [0.5, 1.0, 1.25, 1.5, 2.0];
    final nextIdx = (speeds.indexOf(_playbackSpeed) + 1) % speeds.length;
    final nextSpeed = speeds[nextIdx];
    setState(() => _playbackSpeed = nextSpeed);
    _controller?.setPlaybackSpeed(nextSpeed);
  }

  void _changeQuality() {
    final qualities = ['Auto', '1080p', '720p', '480p'];
    final nextIdx = (qualities.indexOf(_quality) + 1) % qualities.length;
    setState(() => _quality = qualities[nextIdx]);
  }

  void _changeAudio() {
    final audios = ['sub', 'dub', 'hindi'];
    final nextIdx = (audios.indexOf(_activeAudio) + 1) % audios.length;
    setState(() => _activeAudio = audios[nextIdx]);
    _fetchAndInitStream();
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }
}
