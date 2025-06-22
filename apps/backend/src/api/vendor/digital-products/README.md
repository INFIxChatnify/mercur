# Vendor Digital Products API

This API endpoint allows vendors to create and manage digital products through the `/vendor/digital-products` endpoint.

## Endpoints

### GET `/vendor/digital-products`

Lists digital products for the authenticated vendor.

**Query Parameters:**

- `limit` (optional): Number of items to return (default: 20, max: 100)
- `offset` (optional): Number of items to skip (default: 0)
- `fields` (optional): Array of specific fields to include in response
- `order` (optional): Sort order for results

**Response:**

```json
{
  "digital_products": [
    {
      "id": "string",
      "name": "string",
      "medias": [...],
      "product_variant": {...},
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "count": 0,
  "limit": 20,
  "offset": 0
}
```

### POST `/vendor/digital-products`

Creates a new digital product for the authenticated vendor.

**Request Body:**

```json
{
  "name": "Digital Product Name",
  "medias": [
    {
      "type": "MAIN_FILE",
      "file_id": "file_123",
      "mime_type": "application/pdf"
    }
  ],
  "product": {
    "title": "Product Title",
    "description": "Product Description",
    "variants": [
      {
        "title": "Default Variant",
        "prices": [
          {
            "currency_code": "usd",
            "amount": 1000
          }
        ]
      }
    ]
  }
}
```

**Response:**

```json
{
  "digital_product": {
    "id": "string",
    "name": "string",
    "medias": [...],
    "created_at": "string",
    "updated_at": "string"
  }
}
```

## Media Types

The API supports the following media types for digital products:

- `MAIN_FILE`: The primary digital file
- `PREVIEW`: Preview file for the product
- `THUMBNAIL`: Thumbnail image
- `COVER_IMAGE`: Cover image for the product

## Authentication

All endpoints require vendor authentication via:

- API token (`api_token`)
- Cookie authentication (`cookie_auth`)

## Error Responses

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid request body or parameters
- `403 Forbidden`: Unauthorized access or invalid seller
- `500 Internal Server Error`: Server-side errors

Example error response:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```
