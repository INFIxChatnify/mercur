import { z } from 'zod'

import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerProductLink from '../../../links/seller-product'
import { MediaType } from '../../../modules/digital-product/types'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import createDigitalProductWorkflow from '../../../workflows/create-digital-product'
import { CreateDigitalProductMediaInput } from '../../../workflows/create-digital-product/steps/create-digital-product-medias'
import { createVendorDigitalProductsSchema } from './validators.js'

/**
 * @oas [get] /vendor/digital-products
 * operationId: "VendorListDigitalProducts"
 * summary: "List Digital Products"
 * description: "Retrieves a list of digital products for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *       default: 20
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: array
 *       items:
 *         type: string
 *     required: false
 *     description: Fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             digital_products:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/DigitalProduct"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Vendor Digital Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { fields, limit = 20, offset = 0 } = req.validatedQuery || {}
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // Get the seller for the authenticated vendor
    const seller = await fetchSellerByAuthActorId(
      req.auth_context?.actor_id,
      req.scope
    )

    if (!seller) {
      return res.status(403).json({
        message: 'Unauthorized: Invalid seller'
      })
    }

    // Get digital products linked to the seller's products
    const { data: sellerProducts } = await query.graph({
      entity: sellerProductLink.entryPoint,
      fields: ['product.*'],
      filters: { seller_id: seller.id },
      pagination: {
        skip: offset,
        take: limit
      }
    })

    // Extract product IDs
    const productIds = sellerProducts.map((sp) => sp.product.id)

    if (productIds.length === 0) {
      return res.json({
        digital_products: [],
        count: 0,
        limit,
        offset
      })
    }

    // Get digital products for these products
    const { data: digitalProducts, metadata: { count, take, skip } = {} } =
      await query.graph({
        entity: 'digital_product',
        fields: [
          '*',
          'medias.*',
          'product_variant.*',
          'product_variant.product.*',
          ...(fields || [])
        ],
        filters: {
          product_variant: {
            product_id: { $in: productIds }
          }
        },
        pagination: {
          skip: offset,
          take: limit
        }
      })

    res.json({
      digital_products: digitalProducts,
      count,
      limit: take,
      offset: skip
    })
  } catch (error) {
    console.error('Error fetching vendor digital products:', error)
    return res.status(500).json({
      message: 'Internal server error'
    })
  }
}

/**
 * @oas [post] /vendor/digital-products
 * operationId: "VendorCreateDigitalProduct"
 * summary: "Create a Digital Product"
 * description: "Creates a new digital product for the authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateDigitalProduct"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             digital_product:
 *               $ref: "#/components/schemas/DigitalProduct"
 * tags:
 *   - Vendor Digital Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
type CreateRequestBody = z.infer<typeof createVendorDigitalProductsSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateRequestBody>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const requestId = Math.random().toString(36).substring(7)

  try {

    // Get the seller for the authenticated vendor
    const seller = await fetchSellerByAuthActorId(
      req.auth_context?.actor_id,
      req.scope
    )

    if (!seller) {
      return res.status(403).json({
        message: 'Unauthorized: Invalid seller'
      })
    }

    // Validate request body
    if (!req.validatedBody) {
      console.log('Validation failed - no validatedBody found')
      return res.status(400).json({
        message: 'Invalid request body - validation failed'
      })
    }

    // Get default shipping profile
    const {
      data: [shippingProfile]
    } = await query.graph({
      entity: 'shipping_profile',
      fields: ['id']
    })

    // Prepare product data with seller association and required options
    const productData = {
      ...req.validatedBody.product,
      shipping_profile_id: shippingProfile.id,
      // Ensure product has required options
      options: req.validatedBody.product.options || [
        {
          title: 'Default Option',
          values: ['Default Value']
        }
      ],
      // Ensure variants have required options mapping
      variants: req.validatedBody.product.variants.map((variant) => ({
        ...variant,
        options: variant.options || { 'Default Option': 'Default Value' }
      })),
      metadata: {
        seller_id: seller.id
      }
    }

    const { result } = await createDigitalProductWorkflow(req.scope).run({
      input: {
        digital_product: {
          name: req.validatedBody.name,
          medias: req.validatedBody.medias.map((media) => ({
            fileId: media.file_id,
            mimeType: media.mime_type,
            type: media.type === 'MAIN' ? MediaType.MAIN : MediaType.PREVIEW
          })) as Omit<CreateDigitalProductMediaInput, 'digital_product_id'>[]
        },
        product: productData
      }
    })

    res.status(201).json({
      digital_product: result.digital_product
    })
  } catch (error) {
    console.error(`[${requestId}] Error creating vendor digital product:`, error)
    
    // Handle duplicate key errors more gracefully
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        message: 'Digital product with the same media files already exists',
        error: 'Duplicate media files detected. Please use different files or update the existing product.'
      })
    }
    
    return res.status(500).json({
      message: 'Failed to create digital product',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
