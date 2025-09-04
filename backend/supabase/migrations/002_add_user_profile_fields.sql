-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN profile_photo TEXT,
ADD COLUMN birthday TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN users.profile_photo IS 'URL to user profile photo';
COMMENT ON COLUMN users.birthday IS 'User birthday date';
