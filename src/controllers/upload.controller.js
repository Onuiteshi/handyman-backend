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
exports.uploadIdDocument = exports.uploadArtisanPhoto = void 0;
const index_1 = require("../index");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(__dirname, '../../uploads');
// Ensure upload directory exists
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const uploadArtisanPhoto = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Find the artisan record for this user
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId }
        });
        if (!artisan) {
            return res.status(404).json({ message: 'Artisan profile not found' });
        }
        // Update artisan with photo URL
        const updatedArtisan = yield index_1.prisma.artisan.update({
            where: { id: artisan.id },
            data: {
                photoUrl: `/uploads/${req.file.filename}`
            },
            include: {
                user: true
            }
        });
        res.json({
            message: 'Photo uploaded successfully',
            photoUrl: updatedArtisan.photoUrl,
            artisan: {
                id: updatedArtisan.id,
                userId: updatedArtisan.userId,
                skills: updatedArtisan.skills,
                experience: updatedArtisan.experience,
                portfolio: updatedArtisan.portfolio,
                isProfileComplete: updatedArtisan.isProfileComplete,
                bio: updatedArtisan.bio,
                photoUrl: updatedArtisan.photoUrl,
                idDocumentUrl: updatedArtisan.idDocumentUrl,
                isOnline: updatedArtisan.isOnline,
                locationTracking: updatedArtisan.locationTracking,
                latitude: updatedArtisan.latitude,
                longitude: updatedArtisan.longitude,
                lastSeen: updatedArtisan.lastSeen,
                user: {
                    id: updatedArtisan.user.id,
                    name: updatedArtisan.user.name,
                    email: updatedArtisan.user.email,
                    phone: updatedArtisan.user.phone
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.uploadArtisanPhoto = uploadArtisanPhoto;
const uploadIdDocument = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Find the artisan record for this user
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId }
        });
        if (!artisan) {
            return res.status(404).json({ message: 'Artisan profile not found' });
        }
        // Update artisan with ID document URL
        const updatedArtisan = yield index_1.prisma.artisan.update({
            where: { id: artisan.id },
            data: {
                idDocumentUrl: `/uploads/${req.file.filename}`
            },
            include: {
                user: true
            }
        });
        res.json({
            message: 'ID document uploaded successfully',
            idDocumentUrl: updatedArtisan.idDocumentUrl,
            artisan: {
                id: updatedArtisan.id,
                userId: updatedArtisan.userId,
                skills: updatedArtisan.skills,
                experience: updatedArtisan.experience,
                portfolio: updatedArtisan.portfolio,
                isProfileComplete: updatedArtisan.isProfileComplete,
                bio: updatedArtisan.bio,
                photoUrl: updatedArtisan.photoUrl,
                idDocumentUrl: updatedArtisan.idDocumentUrl,
                isOnline: updatedArtisan.isOnline,
                locationTracking: updatedArtisan.locationTracking,
                latitude: updatedArtisan.latitude,
                longitude: updatedArtisan.longitude,
                lastSeen: updatedArtisan.lastSeen,
                user: {
                    id: updatedArtisan.user.id,
                    name: updatedArtisan.user.name,
                    email: updatedArtisan.user.email,
                    phone: updatedArtisan.user.phone
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.uploadIdDocument = uploadIdDocument;
