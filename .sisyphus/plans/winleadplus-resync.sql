-- Clear data hashes to force full re-sync of all WinLeadPlus prospects
-- Run this ONCE after deploying the mapper fixes
-- Next hourly cron will re-process all prospects with corrected mapper

UPDATE winleadplus_mappings SET data_hash = NULL;

-- Verify: SELECT COUNT(*) FROM winleadplus_mappings WHERE data_hash IS NULL;
-- Expected: all rows should have NULL hash after running this script
