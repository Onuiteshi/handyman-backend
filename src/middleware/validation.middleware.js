"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
// Type guard to check if the error is a validation error
const isValidationError = (error) => {
    return error instanceof Object && 'array' in error && typeof error.array === 'function';
};
/**
 * Middleware to handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            errors: errors.array().map((err) => ({
                field: err.param || 'unknown',
                message: err.msg || 'Validation error',
            })),
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
/**
 * Utility to validate request body fields
 * @param validations Array of validation chains
 * @returns Array of middleware functions including the validation and error handler
 */
const validate = (validations) => {
    return [
        ...validations,
        (req, res, next) => {
            (0, exports.handleValidationErrors)(req, res, next);
        },
    ];
};
exports.validate = validate;
