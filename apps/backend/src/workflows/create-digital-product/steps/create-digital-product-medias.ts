import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { DIGITAL_PRODUCT_MODULE } from '../../../modules/digital-product'
import DigitalProductModuleService from '../../../modules/digital-product/service'
import { MediaType } from '../../../modules/digital-product/types'

export type CreateDigitalProductMediaInput = {
  type: MediaType
  fileId: string
  mimeType: string
  digital_product_id: string
}

type CreateDigitalProductMediasStepInput = {
  medias: CreateDigitalProductMediaInput[]
}

const createDigitalProductMediasStep = createStep(
  'create-digital-product-medias',
  async ({ medias }: CreateDigitalProductMediasStepInput, { container }) => {
    const digitalProductModuleService: DigitalProductModuleService =
      container.resolve(DIGITAL_PRODUCT_MODULE)

    console.log(
      'Creating digital product medias:',
      JSON.stringify(medias, null, 2)
    )
    console.log('Number of medias to create:', medias.length)

    // Deduplicate medias by fileId and type before creating
    const uniqueMedias = medias.reduce((acc, media) => {
      const key = `${media.fileId}-${media.type}`
      if (!acc.some((m) => `${m.fileId}-${m.type}` === key)) {
        acc.push(media)
      }
      return acc
    }, [] as CreateDigitalProductMediaInput[])

    console.log('Unique medias after deduplication:', uniqueMedias.length)

    // Check for existing media records to avoid duplicate key errors
    const existingMedias =
      await digitalProductModuleService.listDigitalProductMedias({
        digital_product_id: uniqueMedias[0]?.digital_product_id
      })

    const existingKeys = new Set(
      existingMedias.map((m) => `${m.fileId}-${m.type}`)
    )

    const newMedias = uniqueMedias.filter(
      (media) => !existingKeys.has(`${media.fileId}-${media.type}`)
    )

    console.log(
      `Found ${existingMedias.length} existing medias, creating ${newMedias.length} new medias`
    )

    let digitalProductMedias: any = []

    if (newMedias.length > 0) {
      digitalProductMedias =
        await digitalProductModuleService.createDigitalProductMedias(newMedias)
    }

    // Return all medias (existing + new)
    const allMedias =
      await digitalProductModuleService.listDigitalProductMedias({
        digital_product_id: uniqueMedias[0]?.digital_product_id
      })

    console.log('Total digital product medias:', allMedias.length)

    return new StepResponse(
      {
        digital_product_medias: allMedias
      },
      {
        digital_product_medias: digitalProductMedias // Only delete the newly created ones on rollback
      }
    )
  },
  async ({ digital_product_medias }: any, { container }) => {
    const digitalProductModuleService: DigitalProductModuleService =
      container.resolve(DIGITAL_PRODUCT_MODULE)

    await digitalProductModuleService.deleteDigitalProductMedias(
      digital_product_medias.map((media) => media.id)
    )
  }
)

export default createDigitalProductMediasStep
