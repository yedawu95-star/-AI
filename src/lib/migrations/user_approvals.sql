create table if not exists user_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default now(),
  approved_at timestamp with time zone,
  approved_by uuid references auth.users(id),
  reason text
);

create index idx_user_approvals_status on user_approvals(status);
create index idx_user_approvals_user_id on user_approvals(user_id);

alter table user_approvals enable row level security;

create policy "users can view own approval status" on user_approvals
  for select using (auth.uid() = user_id);

create policy "admins can manage all approvals" on user_approvals
  for all using (auth.uid() in (
    select user_id from user_approvals where status = 'approved' and email like '%@admin%'
  ));
