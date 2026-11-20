"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const faceRoutes_1 = __importDefault(require("./routes/faceRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const settingRoutes_1 = __importDefault(require("./routes/settingRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/face', faceRoutes_1.default);
app.use('/api/attendance', attendanceRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/settings', settingRoutes_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'FaceAttend API Server',
    });
});
// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});
const HOST = '127.0.0.1';
app.listen(PORT, HOST, () => {
    console.log(`🚀 FaceAttend server is running on http://${HOST}:${PORT}`);
});
