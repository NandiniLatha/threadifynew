import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

import { DESIGNERS } from '../lib/data/tailor-config';
import { CATEGORIES } from '../lib/data/tailor-config';

async function getOrCreateUser(email: string, name: string, phone: string, role: 'customer' | 'tailor' | 'admin') {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
    user_metadata: { role, name, phone }
  });

  if (error) {
    console.error(`Failed to create user ${email}:`, error);
    throw error;
  }
  return data.user.id;
}

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1596451190630-186aff535bf2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583391733956-6c79a17a8ee2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1598808503746-f34c53b93f3e?auto=format&fit=crop&w=800&q=80'
];

async function seed() {
  console.log("Starting production seed script...");

  console.log("Setting up Admin...");
  await getOrCreateUser('nandini@threadify.in', 'Nandini Latha Nallamotu', '+919000000000', 'admin');

  console.log("Setting up 25 Customers...");
  const customerIds: string[] = [];
  for (let i = 1; i <= 25; i++) {
    const id = await getOrCreateUser(
      `customer${i}@threadify.in`,
      `Customer ${i}`,
      `+9198000000${i.toString().padStart(2, '0')}`,
      'customer'
    );
    customerIds.push(id);

    // Setup Addresses and Measurements for a few customers
    if (i <= 10) {
      await supabase.from('addresses').insert({
        user_id: id,
        label: 'Home',
        line1: `${100 + i} Fashion Street`,
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400001',
        is_default: true
      });
      await supabase.from('measurements').insert({
        user_id: id,
        label: 'My Measurements',
        chest: 90 + i,
        waist: 75 + i,
        hips: 95 + i,
        height: 165,
        is_default: true
      });
    }
  }

  console.log("Setting up 15 Tailors...");
  const tailorIds: string[] = [];
  
  // Use first 15 from DESIGNERS
  for (let i = 0; i < 15; i++) {
    const t = DESIGNERS[i];
    if (!t) break;

    const id = await getOrCreateUser(t.email, t.name, `+9199000000${i.toString().padStart(2, '0')}`, 'tailor');
    tailorIds.push(id);

    await supabase.from('tailor_profiles').upsert({
      user_id: id,
      bio: t.bio,
      verification_status: 'approved',
      avg_rating: t.rating,
      featured: i < 5,
      location: 'Mumbai, Maharashtra',
      experience_years: getRandomInt(5, 20),
      starting_price: getRandomInt(1000, 5000),
      specialty: [getRandomItem([...CATEGORIES])],
      availability_status: 'accepting_orders',
      portfolio_images: [] // derived in frontend
    });
  }

  console.log("Creating 50 Design Requests & Orders...");
  const statuses = ['draft', 'pending_bids', 'assigned', 'paid', 'in_production', 'shipped', 'delivered', 'reviewed', 'cancelled'];
  
  for (let i = 1; i <= 50; i++) {
    const customerId = getRandomItem(customerIds);
    const status = getRandomItem(statuses);
    
    // 1. Create the base request
    if (status === 'draft') {
      await supabase.from('wishlist_items').insert({
        customer_id: customerId,
        image_url: getRandomItem(IMAGE_URLS),
        ai_tags: ['custom', 'design', `item-${i}`],
        budget_min: 1000,
        budget_max: 5000,
        notes: `Draft note ${i}`
      });
      continue;
    }

    const { data: request } = await supabase.from('design_requests').insert({
      customer_id: customerId,
      image_url: getRandomItem(IMAGE_URLS),
      ai_tags: ['tailored', `style-${i}`],
      budget_min: 1500,
      budget_max: 6000,
      deadline: new Date(Date.now() + getRandomInt(7, 30) * 24 * 60 * 60 * 1000).toISOString(),
      status: status === 'reviewed' ? 'delivered' : status, // temporarily set to delivered, review handles it
      notes: `Design request ${i}`
    }).select().single();

    if (!request) continue;

    // 2. Create images
    await supabase.from('design_request_images').insert({
      request_id: request.id,
      image_url: request.image_url,
      is_primary: true
    });

    if (status === 'pending_bids' || status === 'cancelled') {
      // Just some bids, no accepted
      if (getRandomInt(0, 1) === 1) {
        await supabase.from('quotations').insert({
          request_id: request.id,
          tailor_id: getRandomItem(tailorIds),
          price: getRandomInt(2000, 5000),
          estimated_days: getRandomInt(5, 14),
          bid_status: 'pending'
        });
      }
      continue;
    }

    // 3. For assigned+ statuses, we need an accepted quotation and a tailor
    const assignedTailorId = getRandomItem(tailorIds);
    const price = getRandomInt(2000, 5000);
    
    const { data: quote } = await supabase.from('quotations').insert({
      request_id: request.id,
      tailor_id: assignedTailorId,
      price: price,
      estimated_days: 10,
      bid_status: 'accepted'
    }).select().single();

    // The accept_bid fn logic manually sets tailor_id in tests, so we force it here
    await supabase.from('design_requests').update({
      tailor_id: assignedTailorId,
      accepted_quotation_id: quote?.id
    }).eq('id', request.id);

    if (status === 'assigned') continue;

    // 4. For paid+ statuses, we need a payment record
    await supabase.from('payments').insert({
      order_id: request.id,
      customer_id: customerId,
      tailor_id: assignedTailorId,
      amount: price,
      platform_fee: price * 0.1,
      tailor_payout: price * 0.9,
      payment_status: 'completed',
      razorpay_order_id: `rzp_order_mock_${i}`,
      razorpay_payment_id: `rzp_pay_mock_${i}`
    });

    // Payment trigger updates status to paid automatically.
    // If our target status is beyond paid, update it again.
    if (['in_production', 'shipped', 'delivered', 'reviewed'].includes(status)) {
      const targetStatus = status === 'reviewed' ? 'delivered' : status;
      await supabase.from('design_requests').update({ status: targetStatus }).eq('id', request.id);
    }

    // 5. Add a conversation with a message
    await supabase.from('messages').insert({
      order_id: request.id,
      sender_id: customerId,
      content: `Hello! Looking forward to this order (#${i}).`
    });

    // 6. For reviewed status, add a review
    if (status === 'reviewed') {
      // The review trigger updates the status to reviewed
      await supabase.from('reviews').insert({
        order_id: request.id,
        rating: getRandomInt(4, 5),
        comment: 'Excellent work!'
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
