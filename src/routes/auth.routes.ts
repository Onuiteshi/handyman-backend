import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.utils';

const router = Router();

// Validation middleware
const validateSignup = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('phone').isMobilePhone('any').withMessage('Please enter a valid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Validation error handler
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// User signup
router.post('/user/signup', [...validateSignup, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email or phone' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        name,
        profile: {
          create: {}
        }
      }
    });

    // Generate token
    const token = generateToken(user.id, 'user');

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Artisan signup
router.post('/artisan/signup', [...validateSignup, body('experience').isInt({ min: 0 }), handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password, name, experience, bio } = req.body;

    // Check if artisan already exists
    const existingArtisan = await prisma.artisan.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingArtisan) {
      res.status(400).json({ message: 'Artisan already exists with this email or phone' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create artisan
    const artisan = await prisma.artisan.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        name,
        experience,
        bio,
        profile: {
          create: {}
        }
      }
    });

    // Generate token
    const token = generateToken(artisan.id, 'artisan');

    res.status(201).json({
      message: 'Artisan created successfully',
      token,
      artisan: {
        id: artisan.id,
        email: artisan.email,
        phone: artisan.phone,
        name: artisan.name,
        experience: artisan.experience,
        bio: artisan.bio
      }
    });
  } catch (error) {
    next(error);
  }
});

// User login
router.post('/user/login', [...validateLogin, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user.id, 'user');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Artisan login
router.post('/artisan/login', [...validateLogin, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find artisan
    const artisan = await prisma.artisan.findUnique({
      where: { email }
    });

    if (!artisan) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await comparePassword(password, artisan.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(artisan.id, 'artisan');

    res.json({
      message: 'Login successful',
      token,
      artisan: {
        id: artisan.id,
        email: artisan.email,
        phone: artisan.phone,
        name: artisan.name,
        experience: artisan.experience,
        bio: artisan.bio
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin login (for development only, should be protected in production)
router.post('/admin/login', [...validateLogin, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email, role: 'ADMIN' }
    });

    if (!admin) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token with admin role
    const token = generateToken(admin.id, 'admin', 'ADMIN');

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'ADMIN'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 