"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const artisan_routes_1 = __importDefault(require("./routes/artisan.routes"));
const serviceCategory_routes_1 = __importDefault(require("./routes/serviceCategory.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const artisanStatus_routes_1 = __importDefault(require("./routes/artisanStatus.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const prisma_1 = __importDefault(require("./lib/prisma"));
exports.prisma = prisma_1.default;
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
// Test database connection
prisma_1.default.$connect()
    .then(() => console.log('Successfully connected to the database'))
    .catch((error) => console.error('Error connecting to the database:', error));
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
const apiRouter = express_1.default.Router();
// Mount all API routes
apiRouter.use('/auth', auth_routes_1.default);
apiRouter.use('/users', user_routes_1.default);
apiRouter.use('/artisans', artisan_routes_1.default);
apiRouter.use('/service-categories', serviceCategory_routes_1.default);
apiRouter.use('/uploads', upload_routes_1.default);
apiRouter.use('/artisan', artisanStatus_routes_1.default);
apiRouter.use('/profiles', profile_routes_1.default);
app.use('/api', apiRouter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        status: err.status || 500
    });
});
// Start the server only if this file is run directly
if (require.main === module) {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
// Handle graceful shutdown
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$disconnect();
    process.exit(0);
}));
