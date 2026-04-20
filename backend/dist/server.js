"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const applicantRoutes_1 = __importDefault(require("./routes/applicantRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const auth_1 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Allow all origins for now - restrict in production
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', msg: 'AI Recruitment System API is running' });
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/jobs', auth_1.protect, jobRoutes_1.default); // All job routes require authentication
app.use('/api/applicants', auth_1.protect, applicantRoutes_1.default); // All applicant routes require authentication
app.use('/api/ai', auth_1.protect, auth_1.adminOnly, aiRoutes_1.default); // AI screening - admin only
const start = async () => {
    console.log('[Server] Starting...');
    console.log('[Server] Connecting to database...');
    await (0, db_1.default)();
    console.log('[Server] Database connected, starting HTTP server...');
    app.listen(PORT, () => {
        console.log(`[Server] Running on port ${PORT}`);
        console.log(`[Server] Health check: http://localhost:${PORT}/health`);
    });
};
start().catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});
