"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdmin = exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = '7d';
// Generate JWT token
const generateToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};
// Register new user
const register = async (req, res) => {
    try {
        console.log('[Register] Request body:', req.body);
        const { name, email, password, role = 'recruiter' } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists with this email' });
            return;
        }
        // Create new user
        const user = await User_1.default.create({
            name,
            email,
            password,
            role
        });
        // Generate token
        const token = generateToken(user._id.toString(), user.role);
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        console.error('[Auth] Register error:', error);
        res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
};
exports.register = register;
// Login user
const login = async (req, res) => {
    try {
        console.log('[Login] Request body:', req.body);
        const { email, password } = req.body;
        // Find user with password
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        // Generate token
        const token = generateToken(user._id.toString(), user.role);
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ message: 'Failed to login', error: error.message });
    }
};
exports.login = login;
// Get current user
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to get user', error: error.message });
    }
};
exports.getMe = getMe;
// Create first admin (for initial setup)
const createAdmin = async (req, res) => {
    try {
        // Check if any admin exists
        const existingAdmin = await User_1.default.findOne({ role: 'admin' });
        if (existingAdmin) {
            res.status(400).json({ message: 'Admin already exists' });
            return;
        }
        const { name, email, password } = req.body;
        const admin = await User_1.default.create({
            name,
            email,
            password,
            role: 'admin'
        });
        const token = generateToken(admin._id.toString(), admin.role);
        res.status(201).json({
            message: 'Admin created successfully',
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            },
            token
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create admin', error: error.message });
    }
};
exports.createAdmin = createAdmin;
