import { PrismaClient, UserRole, AuthProvider } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.oTPVerification.deleteMany();
  await prisma.artisanServiceCategory.deleteMany();
  await prisma.artisan.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCategory.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create service categories
  const categories = await Promise.all([
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
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@handyman.com',
      name: 'System Administrator',
      role: UserRole.ADMIN,
      authProvider: AuthProvider.EMAIL,
      password: adminPassword,
      isEmailVerified: true,
      profileComplete: true
    }
  });

  console.log('✅ Created admin user');

  // Create customer users
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        phone: '+1234567890',
        name: 'John Doe',
        role: UserRole.CUSTOMER,
        authProvider: AuthProvider.EMAIL,
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
        role: UserRole.CUSTOMER,
        authProvider: AuthProvider.EMAIL,
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
        role: UserRole.CUSTOMER,
        authProvider: AuthProvider.PHONE,
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
  const artisanUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'master.plumber@example.com',
        phone: '+1234567891',
        name: 'Bob Johnson',
        role: UserRole.ARTISAN,
        authProvider: AuthProvider.EMAIL,
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
        role: UserRole.ARTISAN,
        authProvider: AuthProvider.EMAIL,
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
        role: UserRole.ARTISAN,
        authProvider: AuthProvider.EMAIL,
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
  await Promise.all([
    // Bob Johnson (Plumber) - Plumbing category
    prisma.artisanServiceCategory.create({
      data: {
        artisanId: artisanUsers[0].artisan!.id,
        categoryId: categories[0].id // Plumbing
      }
    }),
    // Sarah Davis (Electrician) - Electrical category
    prisma.artisanServiceCategory.create({
      data: {
        artisanId: artisanUsers[1].artisan!.id,
        categoryId: categories[1].id // Electrical
      }
    }),
    // Tom Anderson (Carpenter) - Carpentry category
    prisma.artisanServiceCategory.create({
      data: {
        artisanId: artisanUsers[2].artisan!.id,
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
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 