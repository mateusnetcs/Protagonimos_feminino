-- Add policy to allow public read access to survey responses
-- This is necessary for the management view to work without authentication
create policy "Allow public read" on survey_responses for select using (true);
