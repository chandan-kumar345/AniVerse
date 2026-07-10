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
dotenv.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS
app.use((0, cors_1.default)({
    origin: '*', // We can restrict this to frontend domain later if needed
    credentials: true,
}));
app.use(express_1.default.json());
// Main API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/anime', anime_routes_1.default);
app.use('/api/watchlist', watchlist_routes_1.default);
app.use('/api/history', history_routes_1.default);
app.use('/api/comments', comment_routes_1.default);
// Health check and root route
app.get('/', (_req, res) => {
    res.json({ message: 'Welcome to the Bankai TV Anime Platform API!' });
});
// Start server
app.listen(PORT, () => {
    console.log(`[Bankai TV Server] running on http://localhost:${PORT}`);
});
