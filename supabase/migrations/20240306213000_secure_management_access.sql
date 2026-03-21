-- Update policies for survey_responses
-- 1. Remove the public read policy we created earlier
DROP POLICY IF EXISTS "Allow public read" ON survey_responses;

-- 2. Ensure only authenticated users can read the responses
-- This policy already exists in the initial migration, but let's make sure it's correct
DROP POLICY IF EXISTS "Allow authenticated read" ON survey_responses;
CREATE POLICY "Allow authenticated read" ON survey_responses 
FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Keep the public insert policy so people can still answer the survey
DROP POLICY IF EXISTS "Allow public insert" ON survey_responses;
CREATE POLICY "Allow public insert" ON survey_responses 
FOR INSERT WITH CHECK (true);
