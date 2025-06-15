import {
  VendorCreateProduct,
  VendorCreateProductType,
  VendorGetProductParams,
  VendorGetProductParamsType,
  VendorUpdateProduct,
  VendorUpdateProductStatus,
  VendorUpdateProductStatusType,
  VendorUpdateProductType
} from '../products/validators'

// Re-export validators from the regular products endpoint
// We can extend or modify these later if needed for digital products
export {
  VendorCreateProductType,
  VendorCreateProduct,
  VendorGetProductParamsType,
  VendorGetProductParams,
  VendorUpdateProductType,
  VendorUpdateProduct,
  VendorUpdateProductStatusType,
  VendorUpdateProductStatus
}
