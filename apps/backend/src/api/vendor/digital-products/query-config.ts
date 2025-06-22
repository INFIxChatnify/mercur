export const vendorDigitalProductFields = [
  'id',
  'name',
  'created_at',
  'updated_at',
  'deleted_at',
  'metadata',
  '*medias',
  '*product_variant',
  'product_variant.product.*',
  'product_variant.product.type.*',
  'product_variant.product.collection.*',
  'product_variant.product.options.*',
  'product_variant.product.options.values.*',
  'product_variant.product.tags.*',
  'product_variant.product.images.*',
  'product_variant.product.variants.*',
  'product_variant.product.variants.prices.*',
  'product_variant.product.variants.options.*'
]

export const vendorDigitalProductQueryConfig = {
  list: {
    defaults: vendorDigitalProductFields,
    isList: true
  },
  retrieve: {
    defaults: vendorDigitalProductFields,
    isList: false
  }
}
