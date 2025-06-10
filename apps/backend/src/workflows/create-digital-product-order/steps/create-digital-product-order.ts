import {
  InferTypeOf,
  OrderLineItemDTO,
  ProductVariantDTO
} from '@medusajs/framework/types'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { DIGITAL_PRODUCT_MODULE } from '../../../modules/digital-product'
import DigitalProduct from '../../../modules/digital-product/models/digital-product'
import DigitalProductModuleService from '../../../modules/digital-product/service'
import { OrderStatus } from '../../../modules/digital-product/types'

type StepInput = {
  items: (OrderLineItemDTO & {
    variant: ProductVariantDTO & {
      digital_product: InferTypeOf<typeof DigitalProduct>
    }
  })[]
}

const createDigitalProductOrderStep = createStep(
  'create-digital-product-order',
  async ({ items }: StepInput, { container }) => {
    const digitalProductModuleService: DigitalProductModuleService =
      container.resolve(DIGITAL_PRODUCT_MODULE)

    const digitalProductIds = items.map(
      (item) => item.variant.digital_product.id
    )

    const digitalProductOrder =
      await digitalProductModuleService.createDigitalProductOrders({
        status: OrderStatus.PENDING,
        products: digitalProductIds
      })

    return new StepResponse(
      {
        digital_product_order: digitalProductOrder
      },
      {
        digital_product_order: digitalProductOrder
      }
    )
  },
  async ({ digital_product_order }: any, { container }) => {
    const digitalProductModuleService: DigitalProductModuleService =
      container.resolve(DIGITAL_PRODUCT_MODULE)

    await digitalProductModuleService.deleteDigitalProductOrders(
      digital_product_order.id
    )
  }
)

export default createDigitalProductOrderStep
