-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- ACCOUNTS
create table accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text not null,
  balance numeric default 0,
  initial_balance numeric default 0,
  color text,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table accounts enable row level security;
create policy "Users can view own accounts" on accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on accounts for delete using (auth.uid() = user_id);

-- TRANSACTIONS
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount numeric not null,
  type text not null, -- 'income' or 'expense'
  category text not null,
  description text,
  date timestamp with time zone not null,
  account_id uuid references accounts(id) on delete cascade,
  is_business boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table transactions enable row level security;
create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions for delete using (auth.uid() = user_id);

-- BUDGETS
create table budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  category text not null,
  limit_amount numeric not null,
  period text default 'monthly',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table budgets enable row level security;
create policy "Users can view own budgets" on budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on budgets for update using (auth.uid() = user_id);
create policy "Users can delete own budgets" on budgets for delete using (auth.uid() = user_id);

-- GOALS
create table goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline timestamp with time zone,
  color text,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table goals enable row level security;
create policy "Users can view own goals" on goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on goals for delete using (auth.uid() = user_id);

-- LOANS
create table loans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  total_amount numeric not null,
  remaining_amount numeric not null,
  interest_rate numeric,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  monthly_payment numeric,
  next_payment_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table loans enable row level security;
create policy "Users can view own loans" on loans for select using (auth.uid() = user_id);
create policy "Users can insert own loans" on loans for insert with check (auth.uid() = user_id);
create policy "Users can update own loans" on loans for update using (auth.uid() = user_id);
create policy "Users can delete own loans" on loans for delete using (auth.uid() = user_id);

-- DEBTS
create table debts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  creditor_name text not null,
  amount numeric not null,
  due_date timestamp with time zone,
  is_paid boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table debts enable row level security;
create policy "Users can view own debts" on debts for select using (auth.uid() = user_id);
create policy "Users can insert own debts" on debts for insert with check (auth.uid() = user_id);
create policy "Users can update own debts" on debts for update using (auth.uid() = user_id);
create policy "Users can delete own debts" on debts for delete using (auth.uid() = user_id);

-- SUBSCRIPTIONS
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  cost numeric not null,
  frequency text not null, -- 'monthly', 'yearly'
  category text,
  next_payment_date timestamp with time zone,
  active boolean default true,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table subscriptions enable row level security;
create policy "Users can view own subscriptions" on subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update own subscriptions" on subscriptions for update using (auth.uid() = user_id);
create policy "Users can delete own subscriptions" on subscriptions for delete using (auth.uid() = user_id);

-- INVOICES
create table invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  number text,
  date timestamp with time zone,
  due_date timestamp with time zone,
  entity_name text not null, -- Client or Supplier
  amount numeric not null,
  type text not null, -- 'issued' or 'received'
  status text default 'draft', -- 'draft', 'sent', 'paid', 'overdue'
  items jsonb,
  linked_transaction_id uuid,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table invoices enable row level security;
create policy "Users can view own invoices" on invoices for select using (auth.uid() = user_id);
create policy "Users can insert own invoices" on invoices for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices" on invoices for update using (auth.uid() = user_id);
create policy "Users can delete own invoices" on invoices for delete using (auth.uid() = user_id);

-- INVESTMENTS
create table investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  symbol text,
  type text, -- 'stock', 'crypto', 'etf', 'bond'
  quantity numeric not null,
  purchase_price numeric,
  current_price numeric,
  purchase_date timestamp with time zone,
  last_updated timestamp with time zone,
  platform text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table investments enable row level security;
create policy "Users can view own investments" on investments for select using (auth.uid() = user_id);
create policy "Users can insert own investments" on investments for insert with check (auth.uid() = user_id);
create policy "Users can update own investments" on investments for update using (auth.uid() = user_id);
create policy "Users can delete own investments" on investments for delete using (auth.uid() = user_id);

-- RECURRING RULES
create table recurring_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount numeric not null,
  type text not null,
  category text not null,
  description text,
  frequency text not null, -- 'monthly', 'yearly'
  start_date timestamp with time zone,
  next_run_date timestamp with time zone,
  account_id uuid references accounts(id) on delete set null,
  is_business boolean default false,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table recurring_rules enable row level security;
create policy "Users can view own recurring_rules" on recurring_rules for select using (auth.uid() = user_id);
create policy "Users can insert own recurring_rules" on recurring_rules for insert with check (auth.uid() = user_id);
create policy "Users can update own recurring_rules" on recurring_rules for update using (auth.uid() = user_id);
create policy "Users can delete own recurring_rules" on recurring_rules for delete using (auth.uid() = user_id);

-- WIDGETS
create table widgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  component_id text not null,
  label text,
  col_span text default '1',
  visible boolean default true,
  "order" integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table widgets enable row level security;
create policy "Users can view own widgets" on widgets for select using (auth.uid() = user_id);
create policy "Users can insert own widgets" on widgets for insert with check (auth.uid() = user_id);
create policy "Users can update own widgets" on widgets for update using (auth.uid() = user_id);
create policy "Users can delete own widgets" on widgets for delete using (auth.uid() = user_id);

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
