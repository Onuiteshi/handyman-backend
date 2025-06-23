"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const artisanStatus_controller_1 = require("../controllers/artisanStatus.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// Apply JWT authentication to all routes
router.use(auth_middleware_1.authMiddleware);
// Update online status
router.put('/online-status', [
    (0, express_validator_1.body)('isOnline').isBoolean().withMessage('isOnline must be a boolean'),
    validation_middleware_1.handleValidationErrors
], artisanStatus_controller_1.updateOnlineStatus);
// Update location consent
router.put('/location-consent', [
    (0, express_validator_1.body)('locationTracking').isBoolean().withMessage('locationTracking must be a boolean'),
    validation_middleware_1.handleValidationErrors
], artisanStatus_controller_1.updateLocationConsent);
// Update location
router.put('/location', [
    (0, express_validator_1.body)('latitude').isFloat().withMessage('latitude must be a number'),
    (0, express_validator_1.body)('longitude').isFloat().withMessage('longitude must be a number'),
    validation_middleware_1.handleValidationErrors
], artisanStatus_controller_1.updateLocation);
// Get current status
router.get('/status', artisanStatus_controller_1.getStatus);
exports.default = router;
