-- The error "profiles_id_fkey" occurs because your "profiles" table currently 
-- requires the "id" to exist in the "auth.users" (Supabase Auth) table.
-- Since we are building a mock directory with generated users, we need to remove this constraint.

-- 1. Check if the constraint exists and drop it
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Ensure the ID still defaults to a UUID if not provided
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. (Optional) If you want to rename "profiles" to "directory_users" to avoid confusion with Auth profiles:
-- ALTER TABLE profiles RENAME TO directory_users;
