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
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'bankai-tv-secret-key-13579';
async function register(req, res) {
    try {
        const { email, username, password } = req.body;
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Random avatar
        const avatars = ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'];
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                avatar: randomAvatar,
            },
        });
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '7d',
        });
        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function login(req, res) {
    try {
        const { emailOrUsername, password } = req.body;
        if (!emailOrUsername || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
            },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '7d',
        });
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getProfile(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                avatar: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ user });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function updateProfile(req, res) {
    try {
        const userId = req.userId;
        const { username, avatar } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const updateData = {};
        if (username)
            updateData.username = username;
        if (avatar)
            updateData.avatar = avatar;
        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    NOT: { id: userId },
                },
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Username is already taken' });
            }
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                avatar: true,
                role: true,
            },
        });
        return res.status(200).json({
            message: 'Profile updated successfully',
            user,
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
