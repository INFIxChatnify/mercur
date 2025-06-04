import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type AdminSellerParamsType = z.infer<typeof AdminSellerParams>
export const AdminSellerParams = createFindParams({
  offset: 0,
  limit: 50
})

export const AdminCreateSellerSchema = z.object({
  name: z.string(),
  member: z.object({
    name: z.string(),
    email: z.string().email()
  })
})

export type AdminCreateSellerType = z.infer<typeof AdminCreateSellerSchema>
