"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_controller_1 = require("../controllers/upload.controller");
const fileUpload_1 = __importDefault(require("../utils/fileUpload"));
const router = (0, express_1.Router)();
// Upload artisan photo
router.post('/artisan/photo', (req, res, next) => {
    (0, auth_middleware_1.authMiddleware)(req, res, next);
}, (req, res, next) => {
    (0, auth_middleware_1.isArtisan)(req, res, next);
}, fileUpload_1.default.single('photo'), (req, res, next) => {
    (0, upload_controller_1.uploadArtisanPhoto)(req, res, next);
});
// Upload ID document
router.post('/artisan/id-document', (req, res, next) => {
    (0, auth_middleware_1.authMiddleware)(req, res, next);
}, (req, res, next) => {
    (0, auth_middleware_1.isArtisan)(req, res, next);
}, fileUpload_1.default.single('document'), (req, res, next) => {
    (0, upload_controller_1.uploadIdDocument)(req, res, next);
});
exports.default = router;
