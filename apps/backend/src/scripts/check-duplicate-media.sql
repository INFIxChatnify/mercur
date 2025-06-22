-- Check total digital product media records
SELECT COUNT(*) as total_records FROM digital_product_media WHERE deleted_at IS NULL;

-- Find duplicate records by digital_product_id and fileId
SELECT 
    digital_product_id,
    "fileId",
    type,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as duplicate_ids,
    STRING_AGG(created_at::text, ', ') as created_times
FROM digital_product_media
WHERE deleted_at IS NULL
GROUP BY digital_product_id, "fileId", type
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Show recent records
SELECT 
    id,
    digital_product_id,
    "fileId",
    type,
    created_at,
    updated_at
FROM digital_product_media
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;