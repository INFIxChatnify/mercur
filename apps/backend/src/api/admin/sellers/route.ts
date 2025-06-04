import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { AdminCreateSellerType } from './validators'

/**
 * @oas [get] /admin/sellers
 * operationId: "AdminListSellers"
 * summary: "List Sellers"
 * description: "Retrieves a list of sellers."
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
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             sellers:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorSeller"
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
 *   - Admin
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellers, metadata } = await query.graph({
    entity: 'seller',
    fields: req.queryConfig.fields,
    pagination: req.queryConfig.pagination
  })

  res.json({
    sellers,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

/**
 * @oas [post] /admin/sellers
 * operationId: "AdminCreateSeller"
 * summary: "Create a Seller"
 * description: "Creates a new seller and associated member."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - name
 *           - member
 *         properties:
 *           name:
 *             type: string
 *             description: The name of the seller
 *           member:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the member
 *               email:
 *                 type: string
 *                 description: The email of the member
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             seller:
 *               $ref: "#/components/schemas/VendorSeller"
 * tags:
 *   - Admin
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: MedusaRequest<AdminCreateSellerType>,
  res: MedusaResponse
): Promise<void> {
  const { name, member } = req.validatedBody

  // Use SellerModuleService to create seller and member
  // const service:any = req.scope.resolve('seller')

  // // Create seller
  // const seller = await service.createSellers({
  //   name,
  //   handle: name.toLowerCase()
  //     .replace(/\s+/g, '-')      // Replace spaces with -
  //     .replace(/[^\w-]+/g, '')   // Remove all non-word chars
  //     .replace(/--+/g, '-')      // Replace multiple - with single -
  //     .replace(/^-+/, '')        // Trim - from start of text
  //     .replace(/-+$/, '')        // Trim - from end of text
  // })

  // // Create member associated with the seller
  // await service.createMembers({
  //   name: member.name,
  //   email: member.email,
  //   seller_id: seller.id,
  //   role: 'owner' // Set the role to owner for the initial member
  // })

  // // Create seller onboarding
  // await service.createSellerOnboardings({
  //   seller_id: seller.id
  // })

  // Fetch the created seller with its member for consistent response
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [createdSeller]
  } = await query.graph({
    entity: 'seller',
    fields: [
      'id',
      'name',
      'handle',
      'created_at',
      'updated_at',
      'members.id',
      'members.name',
      'members.email',
      'members.role'
    ],
    filters: {
      // id: seller.id
      id: ''
    }
  })

  res.status(201).json({
    seller: createdSeller
  })
}
