import { z } from 'zod'

/**
 * Schema for creating a digital product as a vendor
 * Simplified version for debugging
 */
export const createVendorDigitalProductsSchema = z.object({
  name: z.string().min(1, 'Digital product name is required'),
  medias: z
    .array(
      z.object({
        type: z.enum(['MAIN', 'PREVIEW']),
        file_id: z.string().min(1, 'File ID is required'),
        mime_type: z.string().optional().default('application/octet-stream')
      })
    )
    .min(1, 'At least one media file is required'),
  product: z.object({
    title: z.string().min(1, 'Product title is required'),
    description: z.string().optional().default(''),
    options: z
      .array(
        z.object({
          title: z.string(),
          values: z.array(z.string())
        })
      )
      .optional()
      .default([
        {
          title: 'Default Option',
          values: ['Default Value']
        }
      ]),
    variants: z
      .array(
        z.object({
          title: z.string().min(1, 'Variant title is required'),
          options: z
            .record(z.string())
            .optional()
            .default({ 'Default Option': 'Default Value' }),
          prices: z
            .array(
              z.object({
                currency_code: z.string().min(1, 'Currency code is required'),
                amount: z.number().min(0, 'Amount must be non-negative')
              })
            )
            .min(1, 'At least one price is required')
        })
      )
      .min(1, 'At least one variant is required')
  })
})

/**
 * Schema for listing digital products with vendor-specific filters
 */
export const getVendorDigitalProductsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  fields: z.array(z.string()).optional(),
  order: z.string().optional()
})

export type CreateVendorDigitalProductType = z.infer<
  typeof createVendorDigitalProductsSchema
>
export type GetVendorDigitalProductsType = z.infer<
  typeof getVendorDigitalProductsSchema
>

// Add debug test for schema
const testBody = {
  name: 'fgfhvnbvbn',
  medias: [
    {
      type: 'PREVIEW',
      file_id: 'Group 105-01JXT87SA0P3E8HQMG8E65S2EV.png',
      mime_type: 'image/png'
    }
  ],
  product: {
    title: 'dfgfhfgh',
    description: '',
    variants: [
      {
        title: 'Default Variant',
        prices: [
          {
            currency_code: 'usd',
            amount: 0
          }
        ]
      }
    ]
  }
}

try {
  const result = createVendorDigitalProductsSchema.parse(testBody)
  console.log('Schema validation test passed:', result)
} catch (error) {
  console.log('Schema validation test failed:', error)
}
