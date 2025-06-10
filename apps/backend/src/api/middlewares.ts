import multer from 'multer'

import { validateAndTransformBody } from '@medusajs/framework/http'
import { defineMiddlewares } from '@medusajs/medusa'

import { adminMiddlewares } from './admin/middlewares'
import { hooksMiddlewares } from './hooks/middlewares'
import { storeMiddlewares } from './store/middlewares'
import { createDigitalProductsSchema } from './validation-schemas'
import { vendorMiddlewares } from './vendor/middlewares'

const upload = multer({ storage: multer.memoryStorage() })

export default defineMiddlewares({
  routes: [
    ...vendorMiddlewares,
    ...storeMiddlewares,
    ...adminMiddlewares,
    ...hooksMiddlewares,
    {
      matcher: '/admin/digital-products',
      method: 'POST',
      middlewares: [validateAndTransformBody(createDigitalProductsSchema)]
    },
    {
      matcher: '/admin/digital-products/upload**',
      method: 'POST',
      middlewares: [upload.array('files')]
    }
  ]
})
