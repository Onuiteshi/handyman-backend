import { Response, NextFunction, RequestHandler, Request } from 'express';
import { validationResult, ValidationChain, Result, ValidationError } from 'express-validator';
import { AuthRequest } from './auth.middleware';

// Re-export the AuthRequest type for consistency
export { AuthRequest };

// Custom error interface for validation errors
export interface ValidationErrorResponse {
  success: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

// Type guard to check if the error is a validation error
const isValidationError = (error: unknown): error is Result<ValidationError> => {
  return error instanceof Object && 'array' in error && typeof error.array === 'function';
};

/**
 * Middleware to handle validation errors from express-validator
 */
export const handleValidationErrors: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: Result<ValidationError> = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map((err: any) => ({
        field: err.param || 'unknown',
        message: err.msg || 'Validation error',
      })),
    });
    return;
  }
  
  next();
};

/**
 * Utility to validate request body fields
 * @param validations Array of validation chains
 * @returns Array of middleware functions including the validation and error handler
 */
export const validate = (validations: ValidationChain[]): RequestHandler[] => {
  return [
    ...validations,
    (req: Request, res: Response, next: NextFunction) => {
      handleValidationErrors(req as AuthRequest, res, next);
    },
  ];
};
