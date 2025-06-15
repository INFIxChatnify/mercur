import {
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'
import { MiddlewareRoute } from '@medusajs/medusa'

import sellerProductLink from '../../../links/seller-product'
import { ConfigurationRuleType } from '../../../modules/configuration/types'
import {
  checkResourceOwnershipByResourceId,
  filterBySellerId
} from '../../../shared/infra/http/middlewares'
import { checkConfigurationRule } from '../../../shared/infra/http/middlewares'
import { vendorProductQueryConfig } from '../products/query-config'
import { VendorCreateProduct, VendorGetProductParams } from './validators'

const canVendorCreateDigitalProduct = [
  checkConfigurationRule(ConfigurationRuleType.GLOBAL_PRODUCT_CATALOG, false),
  checkConfigurationRule(ConfigurationRuleType.PRODUCT_REQUEST_ENABLED, true)
]

export const vendorDigitalProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/vendor/products-digital',
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.list
      ),
      filterBySellerId()
    ]
  },
  {
    method: ['POST'],
    matcher: '/vendor/products-digital',
    middlewares: [
      ...canVendorCreateDigitalProduct,
      validateAndTransformBody(VendorCreateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  },
  {
    method: ['GET'],
    matcher: '/vendor/products-digital/:id',
    middlewares: [
      checkResourceOwnershipByResourceId({
        entryPoint: sellerProductLink.entryPoint,
        filterField: 'product_id'
      }),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      )
    ]
  }
]
