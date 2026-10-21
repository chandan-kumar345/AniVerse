import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';

class ApiClient {
  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 45),
        receiveTimeout: const Duration(seconds: 45),
        sendTimeout: const Duration(seconds: 45),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _secureStorage.read(key: 'bankai_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Automatic retry for Render cold boot timeouts or transient gateway errors
          final isTimeout = e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.sendTimeout;
          final isServerWaking = e.response?.statusCode == 502 || e.response?.statusCode == 503;

          final retries = (e.requestOptions.extra['retry_count'] as int?) ?? 0;
          if ((isTimeout || isServerWaking) && retries < 1) {
            e.requestOptions.extra['retry_count'] = retries + 1;
            await Future.delayed(const Duration(milliseconds: 1500));
            try {
              final response = await _dio.fetch(e.requestOptions);
              return handler.resolve(response);
            } catch (retryError) {
              if (retryError is DioException) {
                return handler.next(retryError);
              }
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  late final Dio _dio;
  final _secureStorage = const FlutterSecureStorage();

  Dio get dio => _dio;
}
