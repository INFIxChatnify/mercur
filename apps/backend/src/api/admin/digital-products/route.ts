import { z } from 'zod'

import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import createDigitalProductWorkflow from '../../../workflows/create-digital-product'
import { CreateDigitalProductMediaInput } from '../../../workflows/create-digital-product/steps/create-digital-product-medias'
import { createDigitalProductsSchema } from '../../validation-schemas'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { fields, limit = 20, offset = 0 } = req.validatedQuery || {}
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const fileModuleService = req.scope.resolve(Modules.FILE)

  const { data: digitalProducts, metadata: { count, take, skip } = {} } =
    await query.graph({
      entity: 'digital_product',
      fields: ['*', 'medias.*', 'product_variant.*', ...(fields || [])],
      pagination: {
        skip: offset,
        take: limit
      }
    })

  // Enhance media objects with file URLs
  const enhancedDigitalProducts = await Promise.all(
    digitalProducts.map(async (product) => {
      if (product.medias && product.medias.length > 0) {
        const enhancedMedias = await Promise.all(
          product.medias.map(async (media) => {
            try {
              const fileData = await fileModuleService.retrieveFile(media.fileId)
              return {
                ...media,
                url: fileData.url
              }
            } catch (error) {
              console.error(`Failed to retrieve file ${media.fileId}:`, error)
              return media
            }
          })
        )
        return {
          ...product,
          medias: enhancedMedias
        }
      }
      return product
    })
  )

  res.json({
    digital_products: enhancedDigitalProducts,
    count,
    limit: take,
    offset: skip
  })
}

type CreateRequestBody = z.infer<typeof createDigitalProductsSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateRequestBody>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [shippingProfile]
  } = await query.graph({
    entity: 'shipping_profile',
    fields: ['id']
  })

  const { result } = await createDigitalProductWorkflow(req.scope).run({
    input: {
      digital_product: {
        name: req.validatedBody.name,
        medias: req.validatedBody.medias.map((media) => ({
          fileId: media.file_id,
          mimeType: media.mime_type,
          ...media
        })) as Omit<CreateDigitalProductMediaInput, 'digital_product_id'>[]
      },
      product: {
        ...req.validatedBody.product,
        shipping_profile_id: shippingProfile.id
      }
    }
  })

  res.json({
    digital_product: result.digital_product
  })
}
