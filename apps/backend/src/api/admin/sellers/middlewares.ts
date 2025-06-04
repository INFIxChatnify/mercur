import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import { adminSellerQueryConfig } from './query-config'
import { AdminCreateSellerSchema, AdminSellerParams } from './validators'

export const sellerMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/admin/sellers',
    middlewares: [
      validateAndTransformQuery(AdminSellerParams, adminSellerQueryConfig.list)
    ]
  },
  {
    method: ['POST'],
    matcher: '/admin/sellers',
    middlewares: [validateAndTransformBody(AdminCreateSellerSchema)]
  }
]
