import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PhotoSolid } from "@medusajs/icons"
import { Container, Heading, Table,Button } from "@medusajs/ui"
import { useState } from "react"
import { Link } from "react-router-dom"
import { DigitalProduct, MediaType } from "../../types"
import { useMemo,useEffect } from "react"
import { Drawer } from "@medusajs/ui"
import CreateDigitalProductForm from "../../components/create-digital-product-form"


const DigitalProductsPage = () => {
  const [digitalProducts, setDigitalProducts] = useState<
    DigitalProduct[]
  >([])
 const [open, setOpen] = useState(false);
const [currentPage, setCurrentPage] = useState(0)
  const pageLimit = 20
  const [count, setCount] = useState(0)
  const pagesCount = useMemo(() => {
    return count / pageLimit
  }, [count])
  const canNextPage = useMemo(
    () => currentPage < pagesCount - 1, 
    [currentPage, pagesCount]
  )
  const canPreviousPage = useMemo(
    () => currentPage > 0, 
    [currentPage]
  )

  const nextPage = () => {
    if (canNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const previousPage = () => {
    if (canPreviousPage) {
      setCurrentPage((prev) => prev - 1)
    }
  }


   const fetchProducts = () => {
    const query = new URLSearchParams({
      limit: `${pageLimit}`,
      offset: `${pageLimit * currentPage}`,
    })
    
    fetch(`/admin/digital-products?${query.toString()}`, {
      credentials: "include",
    })
    .then((res) => res.json())
    .then(({ 
      digital_products: data, 
      count,
    }) => {
      setDigitalProducts(data)
      setCount(count)
    })
  }

  useEffect(() => {
    fetchProducts()
  }, [currentPage])

  return (
    <Container>
      <div className="flex justify-between items-center mb-4">
        <Heading level="h2">Digital Products</Heading>
        {/* TODO add create button */}
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Preview</Table.HeaderCell>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Media Files</Table.HeaderCell>
            <Table.HeaderCell>Action</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {digitalProducts.map((digitalProduct) => {
            const previewMedias = digitalProduct.medias?.filter(
              (media) => media.type === MediaType.PREVIEW
            ) || []
            const mainMediaCount = digitalProduct.medias?.filter(
              (media) => media.type === MediaType.MAIN
            ).length || 0
            const previewCount = previewMedias.length
            
            return (
              <Table.Row key={digitalProduct.id}>
                <Table.Cell>
                  <div className="flex gap-2">
                    {previewMedias.length > 0 ? (
                      previewMedias.map((media, index) => (
                        <img
                          key={media.id || index}
                          src={media.url || `/files/${media.fileId}`}
                          alt={`${digitalProduct.name} preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <PhotoSolid className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {digitalProduct.name}
                </Table.Cell>
                <Table.Cell>
                  <div className="text-sm">
                    <div>Main: {mainMediaCount}</div>
                    <div>Preview: {previewCount}</div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Link to={`/products/${digitalProduct.product_variant?.product_id}`}>
                    View Product
                  </Link>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
      {/* TODO add pagination component */}
      <Table.Pagination
        count={count}
        pageSize={pageLimit}
        pageIndex={currentPage}
        pageCount={pagesCount}
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        previousPage={previousPage}
        nextPage={nextPage}
      />
       <Drawer open={open} onOpenChange={(openChanged) => setOpen(openChanged)}>
        <Drawer.Trigger 
          onClick={() => {
            setOpen(true)
          }}
          asChild
        >
          <Button>Create</Button>
        </Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Create Product</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <CreateDigitalProductForm onSuccess={() => {
              setOpen(false)
              if (currentPage === 0) {
                fetchProducts()
              } else {
                setCurrentPage(0)
              }
            }} />
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>


    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Digital Products",
  icon: PhotoSolid,
})

export default DigitalProductsPage