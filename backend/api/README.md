# PulseGrid API Documentation

This directory contains the OpenAPI 3.0 specification for the PulseGrid API.

## File

- `openapi.yaml` - Complete OpenAPI 3.0 specification documenting all API endpoints

## How to View the Documentation

### Option 1: View Online (Easiest)

1. Go to https://editor.swagger.io/
2. Click "File" → "Import file"
3. Upload `openapi.yaml`
4. You'll see interactive API documentation with "Try it out" buttons

### Option 2: View from Your API

Once your server is running, visit:
- `http://localhost:8080/api/v1/openapi.yaml`

Then paste the URL into:
- https://editor.swagger.io/ (File → Import URL)
- https://redocly.github.io/redoc/ (paste the URL)

### Option 3: Use Redoc (Beautiful Documentation)

1. Install Redoc CLI: `npm install -g redoc-cli`
2. Run: `redoc-cli serve api/openapi.yaml`
3. Open http://localhost:8080 in your browser

## What's Included

The OpenAPI spec documents:
- ✅ All authentication endpoints
- ✅ All service management endpoints
- ✅ Health check endpoints
- ✅ Alert and subscription endpoints
- ✅ Statistics and analytics endpoints
- ✅ AI prediction endpoints
- ✅ Report export endpoints
- ✅ Admin endpoints
- ✅ Public endpoints
- ✅ Request/response schemas
- ✅ Authentication requirements
- ✅ Error responses

## Updating the Documentation

When you add new endpoints or change existing ones, update `openapi.yaml` to keep the documentation in sync.

## Integration with Swagger UI

To add Swagger UI to your API (optional), you can use the swaggo/swag library. See the main README for instructions.

