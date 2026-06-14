import { config } from 'dotenv'
config()
config({ path: '.env.local', override: true })

import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const menuItems = [
  // Appetizers
  { category: 'Appetizers', name: 'Spring Rolls (2)', price: 3.95, sortOrder: 1 },
  { category: 'Appetizers', name: 'Egg Rolls (2)', price: 3.75, sortOrder: 2 },
  { category: 'Appetizers', name: 'Crab Rangoon (6)', price: 6.95, sortOrder: 3 },
  { category: 'Appetizers', name: 'Dumplings (6)', price: 7.95, sortOrder: 4 },
  { category: 'Appetizers', name: 'BBQ Spare Ribs', price: 10.95, sortOrder: 5 },
  { category: 'Appetizers', name: 'Fried Wonton (10)', price: 6.50, sortOrder: 6 },

  // Soups
  { category: 'Soups', name: 'Egg Drop Soup', price: 3.25, sortOrder: 1 },
  { category: 'Soups', name: 'Wonton Soup', price: 3.75, sortOrder: 2 },
  { category: 'Soups', name: 'Hot and Sour Soup', price: 3.75, sortOrder: 3 },

  // Fried Rice
  { category: 'Fried Rice', name: 'Chicken Fried Rice', price: 10.95, sortOrder: 1 },
  { category: 'Fried Rice', name: 'Beef Fried Rice', price: 11.95, sortOrder: 2 },
  { category: 'Fried Rice', name: 'Shrimp Fried Rice', price: 11.95, sortOrder: 3 },
  { category: 'Fried Rice', name: 'House Special Fried Rice', price: 12.95, sortOrder: 4 },
  { category: 'Fried Rice', name: 'Vegetable Fried Rice', price: 9.95, sortOrder: 5 },

  // Lo Mein
  { category: 'Lo Mein', name: 'Chicken Lo Mein', price: 10.95, sortOrder: 1 },
  { category: 'Lo Mein', name: 'Beef Lo Mein', price: 11.95, sortOrder: 2 },
  { category: 'Lo Mein', name: 'Shrimp Lo Mein', price: 11.95, sortOrder: 3 },
  { category: 'Lo Mein', name: 'Vegetable Lo Mein', price: 9.95, sortOrder: 4 },

  // Beef
  { category: 'Beef', name: 'Beef with Broccoli', price: 13.95, sortOrder: 1 },
  { category: 'Beef', name: 'Mongolian Beef', price: 13.95, sortOrder: 2 },
  { category: 'Beef', name: 'Beef with Snow Peas', price: 13.95, sortOrder: 3 },
  { category: 'Beef', name: 'Pepper Steak', price: 13.95, sortOrder: 4 },

  // Pork
  { category: 'Pork', name: 'Sweet & Sour Pork', price: 12.95, sortOrder: 1 },
  { category: 'Pork', name: 'Moo Shu Pork', price: 13.95, sortOrder: 2 },
  { category: 'Pork', name: 'BBQ Pork with Vegetables', price: 13.95, sortOrder: 3 },

  // Chicken
  { category: 'Chicken', name: "General Tso's Chicken", price: 13.95, sortOrder: 1 },
  { category: 'Chicken', name: 'Kung Pao Chicken', price: 13.95, sortOrder: 2 },
  { category: 'Chicken', name: 'Sesame Chicken', price: 13.95, sortOrder: 3 },
  { category: 'Chicken', name: 'Chicken with Broccoli', price: 13.95, sortOrder: 4 },
  { category: 'Chicken', name: 'Moo Goo Gai Pan', price: 13.95, sortOrder: 5 },
  { category: 'Chicken', name: 'Sweet & Sour Chicken', price: 12.95, sortOrder: 6 },

  // Seafood
  { category: 'Seafood', name: 'Shrimp with Lobster Sauce', price: 14.95, sortOrder: 1 },
  { category: 'Seafood', name: 'Kung Pao Shrimp', price: 14.95, sortOrder: 2 },
  { category: 'Seafood', name: 'Shrimp with Broccoli', price: 14.95, sortOrder: 3 },
  { category: 'Seafood', name: 'Scallops with Vegetables', price: 16.95, sortOrder: 4 },

  // Vegetables
  { category: 'Vegetables', name: 'Mixed Vegetables', price: 10.95, sortOrder: 1 },
  { category: 'Vegetables', name: 'Tofu with Vegetables', price: 11.95, sortOrder: 2 },
  { category: "Vegetables", name: "Buddha's Delight", price: 11.95, sortOrder: 3 },

  // Lunch Specials
  { category: 'Lunch Specials', name: 'L1 - General Tso\'s Chicken', description: 'With fried rice and egg roll. Mon–Fri 11am–3pm', price: 9.95, sortOrder: 1 },
  { category: 'Lunch Specials', name: 'L2 - Chicken with Broccoli', description: 'With fried rice and egg roll. Mon–Fri 11am–3pm', price: 9.95, sortOrder: 2 },
  { category: 'Lunch Specials', name: 'L3 - Beef with Broccoli', description: 'With fried rice and egg roll. Mon–Fri 11am–3pm', price: 10.95, sortOrder: 3 },
  { category: 'Lunch Specials', name: 'L4 - Shrimp with Broccoli', description: 'With fried rice and egg roll. Mon–Fri 11am–3pm', price: 10.95, sortOrder: 4 },

  // Chef's Specials
  { category: "Chef's Specials", name: 'Triple Delight', description: 'Chicken, beef, and shrimp with mixed vegetables', price: 15.95, sortOrder: 1 },
  { category: "Chef's Specials", name: 'Dragon and Phoenix', description: 'Lobster sauce shrimp with General Tso\'s chicken', price: 16.95, sortOrder: 2 },
  { category: "Chef's Specials", name: 'House Special Pan Fried Noodles', price: 14.95, sortOrder: 3 },

  // Desserts
  { category: 'Desserts', name: 'Fried Ice Cream', price: 4.95, sortOrder: 1 },
  { category: 'Desserts', name: 'Fortune Cookies (3)', price: 1.50, sortOrder: 2 },
  { category: 'Desserts', name: 'Mango Pudding', price: 4.50, sortOrder: 3 },

  // Drinks
  { category: 'Drinks', name: 'Can Soda', price: 1.50, sortOrder: 1 },
  { category: 'Drinks', name: 'Hot Tea', price: 1.50, sortOrder: 2 },
  { category: 'Drinks', name: 'Iced Tea', price: 2.50, sortOrder: 3 },
  { category: 'Drinks', name: 'Lychee Juice', price: 2.95, sortOrder: 4 },
]

async function main() {
  console.log('Seeding database...')

  await prisma.menuItem.createMany({
    data: menuItems.map((item) => ({
      ...item,
      price: item.price,
    })),
    skipDuplicates: true,
  })

  const passwordHash = await bcrypt.hash('admin123', 12)
  await prisma.clientUser.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      name: 'Admin',
      passwordHash,
    },
  })

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
