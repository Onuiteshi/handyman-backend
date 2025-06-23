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
const prisma_1 = require("../src/generated/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new prisma_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌱 Starting database seeding...');
        // Clear existing data
        yield prisma.oTPVerification.deleteMany();
        yield prisma.artisanServiceCategory.deleteMany();
        yield prisma.artisan.deleteMany();
        yield prisma.customer.deleteMany();
        yield prisma.user.deleteMany();
        yield prisma.serviceCategory.deleteMany();
        console.log('🗑️  Cleared existing data');
        // Create service categories
        const categories = yield Promise.all([
            prisma.serviceCategory.create({
                data: {
                    name: 'Plumbing',
                    description: 'All plumbing services including repairs, installations, and maintenance'
                }
            }),
            prisma.serviceCategory.create({
                data: {
                    name: 'Electrical',
                    description: 'Electrical services including wiring, installations, and repairs'
                }
            }),
            prisma.serviceCategory.create({
                data: {
                    name: 'Carpentry',
                    description: 'Carpentry services including woodwork, repairs, and installations'
                }
            }),
            prisma.serviceCategory.create({
                data: {
                    name: 'Cleaning',
                    description: 'Professional cleaning services for homes and offices'
                }
            }),
            prisma.serviceCategory.create({
                data: {
                    name: 'Painting',
                    description: 'Interior and exterior painting services'
                }
            })
        ]);
        console.log('✅ Created service categories');
        // Create admin user
        const adminPassword = yield bcryptjs_1.default.hash('admin123', 10);
        const adminUser = yield prisma.user.create({
            data: {
                email: 'admin@handyman.com',
                name: 'System Administrator',
                role: prisma_1.UserRole.ADMIN,
                authProvider: prisma_1.AuthProvider.EMAIL,
                password: adminPassword,
                isEmailVerified: true,
                profileComplete: true
            }
        });
        console.log('✅ Created admin user');
        // Create customer users
        const customers = yield Promise.all([
            prisma.user.create({
                data: {
                    email: 'john.doe@example.com',
                    phone: '+1234567890',
                    name: 'John Doe',
                    role: prisma_1.UserRole.CUSTOMER,
                    authProvider: prisma_1.AuthProvider.EMAIL,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    profileComplete: true,
                    customer: {
                        create: {
                            preferences: {
                                preferredCategories: ['Plumbing', 'Electrical'],
                                notificationPreferences: {
                                    email: true,
                                    sms: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.user.create({
                data: {
                    email: 'jane.smith@example.com',
                    phone: '+1987654321',
                    name: 'Jane Smith',
                    role: prisma_1.UserRole.CUSTOMER,
                    authProvider: prisma_1.AuthProvider.EMAIL,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    profileComplete: true,
                    customer: {
                        create: {
                            preferences: {
                                preferredCategories: ['Cleaning', 'Painting'],
                                notificationPreferences: {
                                    email: true,
                                    sms: false
                                }
                            }
                        }
                    }
                }
            }),
            prisma.user.create({
                data: {
                    email: 'mike.wilson@example.com',
                    phone: '+1555123456',
                    name: 'Mike Wilson',
                    role: prisma_1.UserRole.CUSTOMER,
                    authProvider: prisma_1.AuthProvider.PHONE,
                    isEmailVerified: false,
                    isPhoneVerified: true,
                    profileComplete: true,
                    customer: {
                        create: {
                            preferences: {
                                preferredCategories: ['Carpentry'],
                                notificationPreferences: {
                                    email: false,
                                    sms: true
                                }
                            }
                        }
                    }
                }
            })
        ]);
        console.log('✅ Created customer users');
        // Create artisan users
        const artisanUsers = yield Promise.all([
            prisma.user.create({
                data: {
                    email: 'master.plumber@example.com',
                    phone: '+1234567891',
                    name: 'Bob Johnson',
                    role: prisma_1.UserRole.ARTISAN,
                    authProvider: prisma_1.AuthProvider.EMAIL,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    profileComplete: true,
                    artisan: {
                        create: {
                            skills: ['Pipe Repair', 'Fixture Installation', 'Drain Cleaning'],
                            experience: 8,
                            portfolio: [
                                'https://example.com/portfolio/plumbing1.jpg',
                                'https://example.com/portfolio/plumbing2.jpg'
                            ],
                            isProfileComplete: true,
                            bio: 'Licensed plumber with 8 years of experience in residential and commercial plumbing.',
                            photoUrl: 'https://example.com/photos/bob-johnson.jpg',
                            isOnline: true,
                            locationTracking: true,
                            latitude: 40.7128,
                            longitude: -74.0060
                        }
                    }
                },
                include: {
                    artisan: true
                }
            }),
            prisma.user.create({
                data: {
                    email: 'electric.master@example.com',
                    phone: '+1234567892',
                    name: 'Sarah Davis',
                    role: prisma_1.UserRole.ARTISAN,
                    authProvider: prisma_1.AuthProvider.EMAIL,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    profileComplete: true,
                    artisan: {
                        create: {
                            skills: ['Electrical Wiring', 'Circuit Installation', 'Troubleshooting'],
                            experience: 12,
                            portfolio: [
                                'https://example.com/portfolio/electrical1.jpg',
                                'https://example.com/portfolio/electrical2.jpg'
                            ],
                            isProfileComplete: true,
                            bio: 'Certified electrician specializing in residential and commercial electrical work.',
                            photoUrl: 'https://example.com/photos/sarah-davis.jpg',
                            isOnline: false,
                            locationTracking: false
                        }
                    }
                },
                include: {
                    artisan: true
                }
            }),
            prisma.user.create({
                data: {
                    email: 'wood.craftsman@example.com',
                    phone: '+1234567893',
                    name: 'Tom Anderson',
                    role: prisma_1.UserRole.ARTISAN,
                    authProvider: prisma_1.AuthProvider.EMAIL,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    profileComplete: true,
                    artisan: {
                        create: {
                            skills: ['Custom Furniture', 'Cabinet Making', 'Wood Repairs'],
                            experience: 15,
                            portfolio: [
                                'https://example.com/portfolio/carpentry1.jpg',
                                'https://example.com/portfolio/carpentry2.jpg'
                            ],
                            isProfileComplete: true,
                            bio: 'Master carpenter with 15 years of experience in custom woodwork and furniture making.',
                            photoUrl: 'https://example.com/photos/tom-anderson.jpg',
                            isOnline: true,
                            locationTracking: true,
                            latitude: 40.7589,
                            longitude: -73.9851
                        }
                    }
                },
                include: {
                    artisan: true
                }
            })
        ]);
        console.log('✅ Created artisan users');
        // Assign categories to artisans
        yield Promise.all([
            // Bob Johnson (Plumber) - Plumbing category
            prisma.artisanServiceCategory.create({
                data: {
                    artisanId: artisanUsers[0].artisan.id,
                    categoryId: categories[0].id // Plumbing
                }
            }),
            // Sarah Davis (Electrician) - Electrical category
            prisma.artisanServiceCategory.create({
                data: {
                    artisanId: artisanUsers[1].artisan.id,
                    categoryId: categories[1].id // Electrical
                }
            }),
            // Tom Anderson (Carpenter) - Carpentry category
            prisma.artisanServiceCategory.create({
                data: {
                    artisanId: artisanUsers[2].artisan.id,
                    categoryId: categories[2].id // Carpentry
                }
            })
        ]);
        console.log('✅ Assigned categories to artisans');
        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📊 Seeded Data Summary:');
        console.log(`- ${categories.length} service categories`);
        console.log(`- ${customers.length} customer users`);
        console.log(`- ${artisanUsers.length} artisan users`);
        console.log(`- 1 admin user`);
        console.log('\n🔑 Test Credentials:');
        console.log('Admin: admin@handyman.com / admin123');
        console.log('Customer: john.doe@example.com');
        console.log('Artisan: master.plumber@example.com');
    });
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
