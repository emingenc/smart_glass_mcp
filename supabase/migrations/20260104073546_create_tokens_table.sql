create table tokens (
  email text primary key,
  token text not null,
  created_at bigint
);

-- Enable RLS (Row Level Security)
alter table tokens enable row level security;

-- Create a policy that allows the service role (your MCP server) to do everything
create policy "Service role has full access"
  on tokens
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );
