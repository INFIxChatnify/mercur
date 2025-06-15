import {
  createProductsWorkflow,
  createRemoteLinkStep
} from '@medusajs/medusa/core-flows'
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform
} from '@medusajs/workflows-sdk'

import { REQUESTS_MODULE } from '../../../modules/requests'
import {
  CreateRequestDTO,
  ProductRequestUpdatedEvent,
  RequestStatus,
  SellerRequest
} from '../../../modules/requests/types'
import { SELLER_MODULE } from '../../../modules/seller'
import { emitMultipleEventsStep } from '../../common/steps'
import { createRequestStep } from '../steps'

export const createDigitalProductRequestWorkflow = createWorkflow(
  'create-digital-product-request',
  function (input: {
    data: CreateRequestDTO
    seller_id: string
    additional_data?: any
  }) {
    const productPayload = transform(input, (input) => {
      const payload = {
        ...input.data.data,
        status: input.data.data.status === 'draft' ? 'draft' : 'proposed'
      }

      // Set digital product specific attributes for variants
      if (payload.variants) {
        payload.variants = payload.variants.map((variant) => ({
          ...variant,
          manage_inventory: false,
          allow_backorder: true
          // Remove shipping_profile_id if it exists
          // shipping_profile_id will be omitted
        }))
      }

      return payload
    })

    const product = createProductsWorkflow.runAsStep({
      input: {
        products: [productPayload],
        additional_data: transform(input, (input) => ({
          ...input.additional_data,
          seller_id: input.seller_id
        }))
      }
    })

    const requestPayload = transform(
      { input, productPayload, product },
      ({ input, productPayload, product }) => ({
        ...input.data,
        data: {
          ...productPayload,
          product_id: product[0].id
        },
        status:
          productPayload.status === 'draft'
            ? ('draft' as RequestStatus)
            : ('pending' as RequestStatus)
      })
    )

    const request = createRequestStep(requestPayload)

    const link = transform({ request, input }, ({ request, input }) => {
      return [
        {
          [SELLER_MODULE]: {
            seller_id: input.seller_id
          },
          [REQUESTS_MODULE]: {
            request_id: request[0].id
          }
        }
      ]
    })

    createRemoteLinkStep(link)

    emitMultipleEventsStep([
      {
        name: SellerRequest.CREATED,
        data: { ...input.data, sellerId: input.seller_id }
      },
      {
        name: ProductRequestUpdatedEvent.CREATED,
        data: { id: request[0].id }
      }
    ])

    const digitalProductRequestCreatedHook = createHook(
      'digitalProductRequestCreated',
      {
        requestId: request[0].id,
        sellerId: input.seller_id
      }
    )
    return new WorkflowResponse(request, {
      hooks: [digitalProductRequestCreatedHook]
    })
  }
)
