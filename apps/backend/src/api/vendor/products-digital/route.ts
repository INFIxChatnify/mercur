import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerProductLink from '../../../links/seller-product'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { assignBrandToProductWorkflow } from '../../../workflows/brand/workflows'
import createDigitalProductWorkflow from '../../../workflows/create-digital-product'
import { createDigitalProductRequestWorkflow } from '../../../workflows/requests/workflows/create-digital-product-request'
import {
  VendorCreateProductType,
  VendorGetProductParamsType
} from './validators'

/**
 * @oas [get] /vendor/products-digital
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
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 *   - name: order
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: The order of the returned items.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorProduct"
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
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<VendorGetProductParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerProducts, metadata } = await query.graph({
    entity: sellerProductLink.entryPoint,
    fields: req.queryConfig.fields.map((field) => `product.${field}`),
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    products: sellerProducts.map((product) => product.product),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

/**
 * @oas [post] /vendor/products-digital
 * operationId: "VendorCreateDigitalProduct"
 * summary: "Create a Digital Product"
 * description: "Creates a new digital product for the authenticated vendor. This endpoint creates both a product request and the associated digital product entity."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateProduct"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product:
 *               $ref: "#/components/schemas/VendorProduct"
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateProductType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context?.actor_id,
    req.scope
  )

  // Check if validatedBody exists and provide fallbacks
  if (!req.validatedBody) {
    return res.status(400).json({
      message: 'Invalid request body'
    })
  }

  const { brand_name, additional_data, ...validatedBody } = req.validatedBody

  // First, create the product request using the digital product request workflow
  const { result } = await createDigitalProductRequestWorkflow.run({
    container: req.scope,
    input: {
      seller_id: seller.id,
      data: {
        data: validatedBody,
        type: 'product',
        submitter_id: req.auth_context.actor_id
      },
      additional_data
    }
  })

  const { product_id } = result[0].data

  // Next, create the actual digital product entity and link it to the product variant
  // Extract any digital product-specific properties from additional_data if available
  const digitalProductData = additional_data?.digital_product || {
    name: validatedBody.title, // Based on the required input in CreateDigitalProductStepInput
    medias: additional_data?.images || [] // The media files for the digital product
  }

  await createDigitalProductWorkflow.run({
    input: {
      digital_product: digitalProductData,
      product: { id: product_id } // Link to the product that was just created
    },
    container: req.scope // Pass the container for DI
  })

  if (brand_name) {
    await assignBrandToProductWorkflow.run({
      container: req.scope,
      input: {
        brand_name,
        product_id
      }
    })
  }

  const {
    data: [product]
  } = await query.graph(
    {
      entity: 'product',
      fields: req.queryConfig.fields,
      filters: { id: product_id }
    },
    { throwIfKeyNotFound: true }
  )

  res.status(201).json({ product })
}
