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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = exports.updateLocation = exports.updateLocationConsent = exports.updateOnlineStatus = void 0;
const index_1 = require("../index");
/**
 * Toggle artisan's online status
 */
const updateOnlineStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { isOnline } = req.body;
        // Find the artisan record for this user
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId }
        });
        if (!artisan) {
            res.status(404).json({ message: 'Artisan profile not found' });
            return;
        }
        const updatedArtisan = yield index_1.prisma.artisan.update({
            where: { id: artisan.id },
            data: {
                isOnline,
                lastSeen: isOnline ? new Date() : null
            }
        });
        res.json({
            message: 'Online status updated successfully',
            isOnline: updatedArtisan.isOnline,
            lastSeen: updatedArtisan.lastSeen
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateOnlineStatus = updateOnlineStatus;
/**
 * Update location tracking consent and initial location
 */
const updateLocationConsent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { locationTracking } = req.body;
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId }
        });
        if (!artisan) {
            res.status(404).json({ message: 'Artisan profile not found' });
            return;
        }
        const updatedArtisan = yield index_1.prisma.artisan.update({
            where: { id: artisan.id },
            data: { locationTracking }
        });
        res.json({
            message: 'Location tracking preference updated successfully',
            locationTracking: updatedArtisan.locationTracking
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateLocationConsent = updateLocationConsent;
/**
 * Update artisan's current location
 */
const updateLocation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { latitude, longitude } = req.body;
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId }
        });
        if (!artisan) {
            res.status(404).json({ message: 'Artisan profile not found' });
            return;
        }
        if (!artisan.locationTracking) {
            res.status(403).json({ message: 'Location tracking is disabled' });
            return;
        }
        const updatedArtisan = yield index_1.prisma.artisan.update({
            where: { id: artisan.id },
            data: {
                latitude,
                longitude,
                lastSeen: new Date()
            }
        });
        res.json({
            message: 'Location updated successfully',
            latitude: updatedArtisan.latitude,
            longitude: updatedArtisan.longitude,
            lastSeen: updatedArtisan.lastSeen
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateLocation = updateLocation;
/**
 * Get artisan's current status and location
 */
const getStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId }
        });
        if (!artisan) {
            res.status(404).json({ message: 'Artisan profile not found' });
            return;
        }
        res.json({
            isOnline: artisan.isOnline,
            locationTracking: artisan.locationTracking,
            latitude: artisan.latitude,
            longitude: artisan.longitude,
            lastSeen: artisan.lastSeen
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getStatus = getStatus;
