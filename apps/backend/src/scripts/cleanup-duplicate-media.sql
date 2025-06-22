-- First, let's see the duplicates
SELECT 
    digital_product_id,
    "fileId",
    type,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as duplicate_ids,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM digital_product_media
WHERE deleted_at IS NULL
GROUP BY digital_product_id, "fileId", type
HAVING COUNT(*) > 1;

-- Delete duplicates, keeping only the first (oldest) record
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY digital_product_id, "fileId", type 
            ORDER BY created_at ASC
        ) as rn
    FROM digital_product_media
    WHERE deleted_at IS NULL
)
UPDATE digital_product_media
SET deleted_at = NOW()
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Verify no duplicates remain
SELECT 
    digital_product_id,
    "fileId",
    type,
    COUNT(*) as count
FROM digital_product_media
WHERE deleted_at IS NULL
GROUP BY digital_product_id, "fileId", type
HAVING COUNT(*) > 1;