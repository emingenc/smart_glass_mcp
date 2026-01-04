# Supabase Setup for Mentra MCP

To use Supabase as your storage backend:

1.  **Create a Supabase Project** at [supabase.com](https://supabase.com).
2.  **Apply the Migration**:
    *   **Option A (CLI)**: Run `npx supabase db push` to apply the local migration to your remote project (requires login via `npx supabase login`).
    *   **Option B (Manual)**: Copy the SQL below and run it in the Supabase SQL Editor.

```sql
create table tokens (
  email text primary key,
  token text not null,
  created_at bigint
);

-- Optional: Enable RLS (Row Level Security)
alter table tokens enable row level security;

-- Create a policy that allows the service role (your MCP server) to do everything
create policy "Service role has full access"
  on tokens
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );
```

3.  **Get your credentials**:
    *   `SUPABASE_URL`: Project Settings -> API -> URL
    *   `SUPABASE_SERVICE_KEY`: Project Settings -> API -> `service_role` secret (Do NOT use the `anon` key, as the server needs write access).

4.  **Update your `.env` file**:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

5.  **Restart the server**. It will automatically detect the variables and switch from SQLite to Supabase.
