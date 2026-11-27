import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateCardCode(): string {
  const pick = (n: number) =>
    Array.from(
      { length: n },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join('');
  return `CM-${pick(4)}-${pick(4)}`;
}

async function main() {
  // Backfill: generate codes for loyalty cards created before the QR wallet update.
  // Runs before the seeding guard so it always applies on redeploy.
  const cardsWithoutCode = await prisma.loyaltyCard.findMany({ where: { code: null } });
  for (const card of cardsWithoutCode) {
    await prisma.loyaltyCard.update({
      where: { id: card.id },
      data: { code: generateCardCode() },
    });
  }
  if (cardsWithoutCode.length > 0) {
    console.log(`Backfilled ${cardsWithoutCode.length} loyalty card code(s).`);
  }

  const existingShopsCount = await prisma.shop.count();
  if (existingShopsCount >= 11 && process.env.FORCE_SEED !== 'true') {
    console.log('CoffeeMap database already seeded. Skipping.');
    return;
  }

  console.log('Seeding CoffeeMap database...');

  const tagsData = [
    { name: 'WiFi', slug: 'wifi', icon: 'wifi' },
    { name: 'Study Friendly', slug: 'study-friendly', icon: 'book-open' },
    { name: 'Specialty Coffee', slug: 'specialty-coffee', icon: 'coffee' },
    { name: 'Outdoor Seating', slug: 'outdoor-seating', icon: 'trees' },
  ];

  const tags = await Promise.all(
    tagsData.map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: tag,
        create: tag,
      })
    )
  );

  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t]));

  const passwordHash = await bcrypt.hash('CoffeeMap123!', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@coffeemap.app' },
    update: {},
    create: {
      email: 'demo@coffeemap.app',
      name: 'Layla Al-Mansour',
      passwordHash,
      bio: 'Specialty coffee enthusiast, remote software architect, and espresso hunter.',
      city: 'Riyadh',
      image:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop',
    },
  });

  const secondUser = await prisma.user.upsert({
    where: { email: 'omar@coffeemap.app' },
    update: {},
    create: {
      email: 'omar@coffeemap.app',
      name: 'Omar Khalid',
      passwordHash,
      bio: 'Pour-over fan and weekend cafe explorer.',
      city: 'Dubai',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop',
    },
  });

  const shopsData = [
    {
      name: 'Quba Roast & Brew',
      slug: 'quba-roast-medina',
      description:
        'Warm specialty coffee house on Quba Boulevard offering Ethiopian filter brews, quiet upper-floor study tables, fast WiFi, and palm-lined outdoor seating.',
      address: 'Quba Boulevard, Al-Awali',
      city: 'Medina',
      country: 'Saudi Arabia',
      latitude: 24.4425,
      longitude: 39.6174,
      imageUrl:
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 6:00 AM - 1:00 AM',
      googleMapsUrl: 'https://maps.google.com/?q=24.4425,39.6174',
      tagSlugs: ['wifi', 'study-friendly', 'specialty-coffee', 'outdoor-seating'],
      trendingScore: 94,
    },
    {
      name: 'Sultana Roastery',
      slug: 'sultana-roastery-medina',
      description:
        'Modern specialty roastery in Sultana district known for signature Spanish lattes, V60 single-origin pour-overs, and comfortable laptop seating.',
      address: 'Sultana Road, Al-Qiblatayn',
      city: 'Medina',
      country: 'Saudi Arabia',
      latitude: 24.4774,
      longitude: 39.5858,
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 7:00 AM - 12:30 AM',
      googleMapsUrl: 'https://maps.google.com/?q=24.4774,39.5858',
      tagSlugs: ['wifi', 'study-friendly', 'specialty-coffee'],
      trendingScore: 91,
    },
    {
      name: 'Hejaz Espresso Yard',
      slug: 'hejaz-espresso-medina',
      description:
        'Sunlit garden cafe near King Fahd Road featuring shaded courtyard seating, freshly baked pistachio croissants, and artisanal espresso drinks.',
      address: 'King Fahd Road, Al-Uyun',
      city: 'Medina',
      country: 'Saudi Arabia',
      latitude: 24.4912,
      longitude: 39.5692,
      imageUrl:
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 6:30 AM - 12:00 AM',
      googleMapsUrl: 'https://maps.google.com/?q=24.4912,39.5692',
      tagSlugs: ['specialty-coffee', 'outdoor-seating', 'wifi'],
      trendingScore: 89,
    },
    {
      name: 'Elixir Bunn Coffee Roasters',
      slug: 'elixir-bunn-riyadh',
      description:
        'A flagship specialty roastery known for single-origin pour-overs, calm minimalist interiors, fast fiber WiFi, and sunlit communal tables ideal for focused work.',
      address: 'Tahlia Street, Al Olaya',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      latitude: 24.7009,
      longitude: 46.6852,
      imageUrl:
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 6:30 AM - 12:00 AM',
      googleMapsUrl: 'https://maps.google.com/?q=24.7009,46.6852',
      tagSlugs: ['wifi', 'study-friendly', 'specialty-coffee'],
      trendingScore: 96,
    },
    {
      name: 'Camel Step Roastery',
      slug: 'camel-step-riyadh',
      description:
        'Warm architectural space offering micro-lot filter brews, freshly baked cardamom croissants, and shaded courtyard seating.',
      address: 'Al Malqa, Anas Ibn Malik Rd',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      latitude: 24.7985,
      longitude: 46.6152,
      imageUrl:
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 7:00 AM - 11:30 PM',
      googleMapsUrl: 'https://maps.google.com/?q=24.7985,46.6152',
      tagSlugs: ['specialty-coffee', 'outdoor-seating', 'wifi'],
      trendingScore: 92,
    },
    {
      name: 'Nightjar Coffee Roasters',
      slug: 'nightjar-coffee-dubai',
      description:
        'Industrial-chic roastery in Alserkal Avenue serving nitro cold brew on tap, artisanal espresso flights, and vibrant creative energy.',
      address: 'Alserkal Avenue, Al Quoz',
      city: 'Dubai',
      country: 'UAE',
      latitude: 25.1408,
      longitude: 55.2261,
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 8:00 AM - 10:00 PM',
      googleMapsUrl: 'https://maps.google.com/?q=25.1408,55.2261',
      tagSlugs: ['specialty-coffee', 'wifi', 'outdoor-seating'],
      trendingScore: 94,
    },
    {
      name: 'Monmouth Coffee Company',
      slug: 'monmouth-coffee-london',
      description:
        'Iconic Borough Market specialty coffee house famous for sustainably sourced single-origin beans and cozy wooden benches.',
      address: '2 Park Street, Borough Market',
      city: 'London',
      country: 'UK',
      latitude: 51.5055,
      longitude: -0.0912,
      imageUrl:
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop',
      openingHours: 'Mon-Sat: 7:30 AM - 6:00 PM',
      googleMapsUrl: 'https://maps.google.com/?q=51.5055,-0.0912',
      tagSlugs: ['specialty-coffee', 'outdoor-seating'],
      trendingScore: 89,
    },
    {
      name: 'Kurasu Kyoto Espresso Bar',
      slug: 'kurasu-kyoto-tokyo',
      description:
        'Serene Japanese coffee sanctuary dedicated to precision V60 pour-overs, ceremonial matcha lattes, and quiet study corners.',
      address: 'Ebisu-nishi, Shibuya-ku',
      city: 'Tokyo',
      country: 'Japan',
      latitude: 35.6478,
      longitude: 139.7082,
      imageUrl:
        'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 8:00 AM - 8:00 PM',
      googleMapsUrl: 'https://maps.google.com/?q=35.6478,139.7082',
      tagSlugs: ['wifi', 'study-friendly', 'specialty-coffee'],
      trendingScore: 95,
    },
    {
      name: 'Café Kitsuné Palais Royal',
      slug: 'cafe-kitsune-paris',
      description:
        'Parisian specialty espresso bar tucked inside the Palais Royal gardens with classic terrace seating and signature fox shortbread.',
      address: '51 Galerie de Montpensier',
      city: 'Paris',
      country: 'France',
      latitude: 48.8648,
      longitude: 2.3375,
      imageUrl:
        'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 8:30 AM - 7:00 PM',
      googleMapsUrl: 'https://maps.google.com/?q=48.8648,2.3375',
      tagSlugs: ['outdoor-seating', 'specialty-coffee'],
      trendingScore: 87,
    },
    {
      name: 'Brew & Co. Study Lounge',
      slug: 'brew-and-co-jeddah',
      description:
        'Designed for deep work and creative sprints: power outlets at every seat, acoustic calm zones, gigabit WiFi, and honey cortados.',
      address: 'Al Rawdah District, Prince Saud Al Faisal St',
      city: 'Jeddah',
      country: 'Saudi Arabia',
      latitude: 21.5597,
      longitude: 39.1563,
      imageUrl:
        'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 7:00 AM - 1:00 AM',
      googleMapsUrl: 'https://maps.google.com/?q=21.5597,39.1563',
      tagSlugs: ['wifi', 'study-friendly', 'specialty-coffee', 'outdoor-seating'],
      trendingScore: 91,
    },
    {
      name: 'Devoción Roastery Loft',
      slug: 'devocion-brooklyn-ny',
      description:
        'Lush living plant wall inside a skylit Williamsburg warehouse serving farm-fresh Colombian coffee roasted daily.',
      address: '69 Grand St, Brooklyn',
      city: 'New York',
      country: 'USA',
      latitude: 40.7158,
      longitude: -73.9647,
      imageUrl:
        'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1200&auto=format&fit=crop',
      openingHours: 'Daily: 7:30 AM - 7:00 PM',
      googleMapsUrl: 'https://maps.google.com/?q=40.7158,-73.9647',
      tagSlugs: ['wifi', 'study-friendly', 'specialty-coffee'],
      trendingScore: 93,
    },
  ];

  const createdShops = [];
  for (const shopData of shopsData) {
    const { tagSlugs, ...rest } = shopData;
    const shop = await prisma.shop.upsert({
      where: { slug: rest.slug },
      update: {
        ...rest,
        tags: {
          set: tagSlugs.map((slug) => ({ id: tagBySlug[slug].id })),
        },
      },
      create: {
        ...rest,
        tags: {
          connect: tagSlugs.map((slug) => ({ id: tagBySlug[slug].id })),
        },
      },
    });
    createdShops.push(shop);
  }

  const shopBySlug = Object.fromEntries(createdShops.map((s) => [s.slug, s]));

  const seedReviews = [
    {
      shopSlug: 'quba-roast-medina',
      userId: demoUser.id,
      rating: 5,
      title: 'Calm study floor and bright Ethiopian V60',
      comment:
        'Great WiFi upstairs, quiet tables with outlets, and lovely outdoor seating along Quba Boulevard.',
    },
    {
      shopSlug: 'sultana-roastery-medina',
      userId: secondUser.id,
      rating: 5,
      title: 'Smooth Spanish latte & great pour-over',
      comment: 'Friendly baristas, balanced espresso, and comfortable seating for remote work.',
    },
    {
      shopSlug: 'hejaz-espresso-medina',
      userId: demoUser.id,
      rating: 4,
      title: 'Peaceful courtyard and fresh pastries',
      comment:
        'Shaded garden tables make morning coffee very relaxing. Pistachio croissant is delicious.',
    },
    {
      shopSlug: 'elixir-bunn-riyadh',
      userId: demoUser.id,
      rating: 5,
      title: 'Best V60 and work setup in Riyadh',
      comment:
        'Super reliable WiFi, calm lighting, and the Ethiopian Yirgacheffe V60 was bright and floral. Plenty of power outlets near the window.',
    },
    {
      shopSlug: 'elixir-bunn-riyadh',
      userId: secondUser.id,
      rating: 5,
      title: 'Consistent espresso quality',
      comment:
        'Baristas know their craft well. Flat white texture is velvety and the morning vibe is great for reading.',
    },
    {
      shopSlug: 'camel-step-riyadh',
      userId: demoUser.id,
      rating: 5,
      title: 'Lovely courtyard at sunset',
      comment:
        'Outdoor seating is shaded and peaceful. Cardamom pastry pairs wonderfully with their house espresso.',
    },
    {
      shopSlug: 'nightjar-coffee-dubai',
      userId: secondUser.id,
      rating: 5,
      title: 'Cold brew heaven',
      comment:
        'The nitro cold brew is unmatched in Dubai. Amazing music selection and industrial art gallery surroundings.',
    },
    {
      shopSlug: 'kurasu-kyoto-tokyo',
      userId: demoUser.id,
      rating: 5,
      title: 'Precision pour-over experience',
      comment:
        'Quiet atmosphere, minimalist wooden counter, and super friendly staff who walk you through tasting notes.',
    },
    {
      shopSlug: 'brew-and-co-jeddah',
      userId: secondUser.id,
      rating: 4,
      title: 'Ideal for deep study sessions',
      comment:
        'Fast WiFi and plenty of desks. Can get busy after 7 PM, so arrive early for the quiet booths.',
    },
  ];

  // Clear existing seed reviews for idempotent re-seeding
  await prisma.review.deleteMany({
    where: {
      userId: { in: [demoUser.id, secondUser.id] },
    },
  });

  for (const r of seedReviews) {
    const shop = shopBySlug[r.shopSlug];
    if (!shop) continue;
    await prisma.review.create({
      data: {
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        userId: r.userId,
        shopId: shop.id,
      },
    });
  }

  // Favorite a few shops for demoUser
  for (const idx of [0, 1, 4]) {
    const shop = createdShops[idx];
    if (!shop) continue;
    await prisma.favorite.upsert({
      where: {
        userId_shopId: {
          userId: demoUser.id,
          shopId: shop.id,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        shopId: shop.id,
      },
    });
  }

  // Recalculate ratings, review counts, favorite counts, and AI summaries
  for (const shop of createdShops) {
    const stats = await prisma.review.aggregate({
      where: { shopId: shop.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const favCount = await prisma.favorite.count({ where: { shopId: shop.id } });
    const avg = Number((stats._avg.rating ?? 4.7).toFixed(2));
    const revCount = stats._count.rating;

    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        averageRating: revCount > 0 ? avg : 4.7,
        reviewCount: revCount,
        favoriteCount: favCount,
        aiSummary:
          revCount > 0
            ? `Guests praise ${shop.name} for its specialty craft coffee, inviting atmosphere, and reliable amenities (${avg}/5 across ${revCount} reviews).`
            : `${shop.name} stands out in ${shop.city} for signature brews and thoughtfully designed seating.`,
        aiSummaryUpdatedAt: new Date(),
      },
    });
  }

  // Award initial badges to demoUser
  await prisma.userBadge.upsert({
    where: { userId_code: { userId: demoUser.id, code: 'FIRST_SIP' } },
    update: {},
    create: {
      userId: demoUser.id,
      code: 'FIRST_SIP',
      name: 'First Sip',
      description: 'Published your first coffee shop review.',
      icon: 'coffee',
    },
  });
  await prisma.userBadge.upsert({
    where: { userId_code: { userId: demoUser.id, code: 'CURATOR' } },
    update: {},
    create: {
      userId: demoUser.id,
      code: 'CURATOR',
      name: 'Cafe Curator',
      description: 'Saved 3 or more favorite coffee shops.',
      icon: 'heart',
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
