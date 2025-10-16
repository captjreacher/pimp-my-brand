-- Super simple admin setup script
-- Everything is already set up correctly, just need to make you admin!

-- Make your account super_admin (replace with your actual user ID)
UPDATE profiles SET app_role = 'super_admin' WHERE id = 'bdc1eedc-87e5-43ae-9304-16e673986696';

-- Verify the change
SELECT id, email, app_role FROM profiles WHERE app_role = 'super_admin';