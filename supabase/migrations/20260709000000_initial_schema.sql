-- Create role enum type
create type user_role as enum ('customer', 'tailor', 'admin');

-- Create public users table
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role user_role not null default 'customer',
  name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.users enable row level security;

-- Policies
create policy "Allow public read access to profiles" on public.users
  for select using (true);

create policy "Allow users to update their own profiles" on public.users
  for update using (auth.uid() = id);

-- Trigger function to copy new user from auth.users to public.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, name, phone)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'::user_role),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create design_requests status type
create type request_status as enum ('draft', 'pending_bids', 'assigned', 'in_production', 'delivered', 'cancelled');

-- Create design_requests table
create table public.design_requests (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.users(id) on delete cascade not null,
  image_url text not null,
  ai_tags jsonb default '[]'::jsonb not null,
  budget_min numeric(10, 2) not null,
  budget_max numeric(10, 2) not null,
  deadline date not null,
  status request_status not null default 'pending_bids',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create wishlist_items table (for saved drafts without submitting)
create table public.wishlist_items (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.users(id) on delete cascade not null,
  image_url text not null,
  ai_tags jsonb default '[]'::jsonb not null,
  budget_min numeric(10, 2),
  budget_max numeric(10, 2),
  deadline date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.design_requests enable row level security;
alter table public.wishlist_items enable row level security;

-- Policies for design_requests
create policy "Allow users to read their own design requests" on public.design_requests
  for select using (auth.uid() = customer_id);

create policy "Allow tailors to read pending design requests" on public.design_requests
  for select using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'tailor'::user_role
    ) and status = 'pending_bids'::request_status
  );

create policy "Allow customers to create design requests" on public.design_requests
  for insert with check (auth.uid() = customer_id);

create policy "Allow customers to update their own design requests" on public.design_requests
  for update using (auth.uid() = customer_id);

-- Policies for wishlist_items
create policy "Allow users to manage their own wishlist items" on public.wishlist_items
  for all using (auth.uid() = customer_id);

-- Create verification_status enum type
create type verification_status_type as enum ('pending', 'approved', 'rejected');

-- Create tailor_profiles table
create table public.tailor_profiles (
  user_id uuid references public.users(id) on delete cascade primary key,
  bio text,
  verification_status verification_status_type not null default 'pending',
  verification_docs_url text,
  stripe_account_id text,
  razorpay_account_id text,
  avg_rating numeric(3, 2) default 5.00,
  portfolio_images text[] default '{}'::text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create quotations table
create table public.quotations (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.design_requests(id) on delete cascade not null,
  tailor_id uuid references public.users(id) on delete cascade not null,
  price numeric(10, 2) not null,
  estimated_days integer not null,
  note text,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tailor_profiles enable row level security;
alter table public.quotations enable row level security;

-- Policies for tailor_profiles
create policy "Allow public read access to tailor profiles" on public.tailor_profiles
  for select using (true);

create policy "Allow tailors to manage their own profiles" on public.tailor_profiles
  for all using (auth.uid() = user_id);

-- Policies for quotations
create policy "Allow users to read quotations for their own design requests" on public.quotations
  for select using (
    exists (
      select 1 from public.design_requests
      where design_requests.id = quotations.request_id and design_requests.customer_id = auth.uid()
    )
  );

create policy "Allow tailors to manage their own quotations" on public.quotations
  for all using (auth.uid() = tailor_id);

-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.design_requests(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  attachment_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies for messages
create policy "Allow participants of the request to read messages" on public.messages
  for select using (
    exists (
      select 1 from public.design_requests
      where design_requests.id = messages.order_id and (
        design_requests.customer_id = auth.uid() or
        exists (
          select 1 from public.quotations
          where quotations.request_id = design_requests.id and quotations.tailor_id = auth.uid()
        )
      )
    )
  );

create policy "Allow participants to insert messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.design_requests
      where design_requests.id = order_id and (
        design_requests.customer_id = auth.uid() or
        exists (
          select 1 from public.quotations
          where quotations.request_id = design_requests.id and quotations.tailor_id = auth.uid()
        )
      )
    )
  );

-- Create disputes table
create table public.disputes (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.design_requests(id) on delete cascade not null,
  raised_by uuid references public.users(id) on delete cascade not null,
  reason text not null,
  status text not null default 'open',
  admin_notes text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.disputes enable row level security;

-- Policies for disputes
create policy "Allow admins full access to disputes" on public.disputes
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Allow participants of design requests to read disputes" on public.disputes
  for select using (
    exists (
      select 1 from public.design_requests
      where design_requests.id = disputes.order_id and (
        design_requests.customer_id = auth.uid() or
        exists (
          select 1 from public.quotations
          where quotations.request_id = design_requests.id and quotations.tailor_id = auth.uid()
        )
      )
    )
  );

create policy "Allow participants to insert disputes" on public.disputes
  for insert with check (
    auth.uid() = raised_by and
    exists (
      select 1 from public.design_requests
      where design_requests.id = order_id and (
        design_requests.customer_id = auth.uid() or
        exists (
          select 1 from public.quotations
          where quotations.request_id = design_requests.id and quotations.tailor_id = auth.uid()
        )
      )
    )
  );

-- Create reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.design_requests(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies for reviews
create policy "Allow anyone to read reviews" on public.reviews
  for select using (true);

create policy "Allow customer of order to insert review" on public.reviews
  for insert with check (
    exists (
      select 1 from public.design_requests
      where design_requests.id = order_id and design_requests.customer_id = auth.uid()
    )
  );

-- Create notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  link text,
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies for notifications
create policy "Allow users to manage their own notifications" on public.notifications
  for all using (auth.uid() = user_id);





