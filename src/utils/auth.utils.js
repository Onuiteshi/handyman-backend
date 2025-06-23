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
exports.compareProfileToken = exports.hashProfileToken = exports.generateProfileInvitationToken = exports.generateSecureOTP = exports.generateSessionToken = exports.generateRefreshToken = exports.generateProfileToken = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
exports.verifyToken = verifyToken;
exports.verifyProfileToken = verifyProfileToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
});
exports.hashPassword = hashPassword;
const comparePassword = (password, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return bcryptjs_1.default.compare(password, hashedPassword);
});
exports.comparePassword = comparePassword;
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
};
exports.generateToken = generateToken;
const generateProfileToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' } // Profile sessions expire in 24 hours
    );
};
exports.generateProfileToken = generateProfileToken;
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(64).toString('hex');
};
exports.generateRefreshToken = generateRefreshToken;
const generateSessionToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateSessionToken = generateSessionToken;
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
}
function verifyProfileToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
}
const generateSecureOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateSecureOTP = generateSecureOTP;
const generateProfileInvitationToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateProfileInvitationToken = generateProfileInvitationToken;
const hashProfileToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield bcryptjs_1.default.genSalt(12);
    return bcryptjs_1.default.hash(token, salt);
});
exports.hashProfileToken = hashProfileToken;
const compareProfileToken = (token, hashedToken) => __awaiter(void 0, void 0, void 0, function* () {
    return bcryptjs_1.default.compare(token, hashedToken);
});
exports.compareProfileToken = compareProfileToken;
