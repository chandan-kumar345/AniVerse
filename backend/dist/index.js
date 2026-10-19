"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const anime_routes_1 = __importDefault(require("./routes/anime.routes"));
const watchlist_routes_1 = __importDefault(require("./routes/watchlist.routes"));
const history_routes_1 = __importDefault(require("./routes/history.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
dotenv.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Trust proxy for Render / Cloudflare reverse proxies
app.set('trust proxy', 1);
// Allowed origins for CORS (Local dev + Vercel production & preview deployments)
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()) : []),
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((u) => u.trim()) : []),
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin)
            return callback(null, true);
        // Automatically allow all *.vercel.app deployment domains and specified origins
        if (allowedOrigins.includes(origin) ||
            allowedOrigins.includes('*') ||
            origin.endsWith('.vercel.app') ||
            /\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir));
// Main API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/anime', anime_routes_1.default);
app.use('/api/watchlist', watchlist_routes_1.default);
app.use('/api/history', history_routes_1.default);
app.use('/api/comments', comment_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Health check and root routes for Render deployment
app.get('/', (_req, res) => {
    res.json({ message: 'Welcome to the AniVerse Anime Platform API!', status: 'running' });
});
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'AniVerse API', timestamp: new Date().toISOString() });
});
app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'AniVerse API', timestamp: new Date().toISOString() });
});
// Start server
app.listen(PORT, () => {
    console.log(`[AniVerse Server] running on http://localhost:${PORT}`);
});
