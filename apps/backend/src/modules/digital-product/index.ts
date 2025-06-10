import { Module } from '@medusajs/framework/utils'

import DigitalProductModuleService from './service'

export const DIGITAL_PRODUCT_MODULE = 'digitalProductModuleService'

export default Module(DIGITAL_PRODUCT_MODULE, {
  service: DigitalProductModuleService
})
