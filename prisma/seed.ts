import { PrismaClient, UserRole } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';
import { hashPassword } from '../src/utils/auth.utils';

const prisma = new PrismaClient();

async function createAdminUser(prisma: PrismaClient) {
  const adminEmail = 'admin@handyman.com';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword('admin123');
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        phone: '+2348000000000',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        profile: {
          create: {
            address: 'Admin Address',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria'
          }
        }
      }
    });
    
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }
}

async function main() {
  // Create admin user first
  await createAdminUser(prisma);
  // Create service categories first
  const categories = await Promise.all([
    prisma.serviceCategory.create({
      data: {
        name: 'Plumbing',
        description: 'Professional plumbing services including repairs, installations, and maintenance',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: 'Electrical',
        description: 'Electrical repairs, installations, and safety inspections',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: 'Carpentry',
        description: 'Woodworking, furniture repair, and general carpentry services',
      },
    }),
  ]);

  // Create users with profiles
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        phone: '+2348012345678',
        password: await bcrypt.hash('password123', 10),
        name: 'John Doe',
        profile: {
          create: {
            address: '123 Main Street',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        phone: '+2348023456789',
        password: await bcrypt.hash('password123', 10),
        name: 'Jane Smith',
        profile: {
          create: {
            address: '456 Park Avenue',
            city: 'Abuja',
            state: 'FCT',
            country: 'Nigeria',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.johnson@example.com',
        phone: '+2348034567890',
        password: await bcrypt.hash('password123', 10),
        name: 'Mike Johnson',
        profile: {
          create: {
            address: '789 Oak Road',
            city: 'Port Harcourt',
            state: 'Rivers',
            country: 'Nigeria',
          },
        },
      },
    }),
  ]);

  // Create artisans with profiles and service categories
  const artisans = await Promise.all([
    prisma.artisan.create({
      data: {
        email: 'master.plumber@example.com',
        phone: '+2348045678901',
        password: await bcrypt.hash('password123', 10),
        name: 'Master Plumber',
        experience: 15,
        bio: 'Professional plumber with 15 years of experience in residential and commercial plumbing',
        photoUrl: 'https://example.com/plumber.jpg',
        profile: {
          create: {
            address: '321 Water Street',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
          },
        },
        categories: {
          create: {
            categoryId: categories[0].id, // Plumbing
          },
        },
      },
    }),
    prisma.artisan.create({
      data: {
        email: 'electric.master@example.com',
        phone: '+2348056789012',
        password: await bcrypt.hash('password123', 10),
        name: 'Electric Master',
        experience: 12,
        bio: 'Certified electrician specializing in residential and commercial electrical work',
        photoUrl: 'https://example.com/electrician.jpg',
        profile: {
          create: {
            address: '654 Power Avenue',
            city: 'Abuja',
            state: 'FCT',
            country: 'Nigeria',
          },
        },
        categories: {
          create: {
            categoryId: categories[1].id, // Electrical
          },
        },
      },
    }),
    prisma.artisan.create({
      data: {
        email: 'wood.craftsman@example.com',
        phone: '+2348067890123',
        password: await bcrypt.hash('password123', 10),
        name: 'Wood Craftsman',
        experience: 20,
        bio: 'Master carpenter with expertise in custom furniture and home renovations',
        photoUrl: 'https://example.com/carpenter.jpg',
        profile: {
          create: {
            address: '987 Timber Road',
            city: 'Port Harcourt',
            state: 'Rivers',
            country: 'Nigeria',
          },
        },
        categories: {
          create: {
            categoryId: categories[2].id, // Carpentry
          },
        },
      },
    }),
  ]);

  console.log('Database has been seeded. 🌱');
  console.log('Created users:', users.length);
  console.log('Created artisans:', artisans.length);
  console.log('Created service categories:', categories.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 