import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import { vendorDigitalProductQueryConfig } from './query-config'
import {
  createVendorDigitalProductsSchema,
  getVendorDigitalProductsSchema
} from './validators'

export const vendorNewDigitalProductsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/vendor/digital-products',
    method: 'GET',
    middlewares: [
      validateAndTransformQuery(
        getVendorDigitalProductsSchema,
        vendorDigitalProductQueryConfig.list
      )
    ]
  },
  {
    matcher: '/vendor/digital-products',
    method: 'POST',
    middlewares: [validateAndTransformBody(createVendorDigitalProductsSchema)]
  }
]
