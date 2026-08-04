-- Create saved_tailors table
create table public.saved_tailors (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.users(id) on delete cascade not null,
  tailor_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(customer_id, tailor_id)
);

-- Enable RLS
alter table public.saved_tailors enable row level security;

-- Policies for saved_tailors
create policy "Allow users to manage their own saved tailors" on public.saved_tailors
  for all using (auth.uid() = customer_id);
