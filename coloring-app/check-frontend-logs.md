# Frontend Error Debugging

## How to Check Frontend Network Errors:

1. **Open your browser** to http://localhost:5173
2. **Open Developer Tools** (F12)
3. **Click the "Network" tab**
4. **Try generating an image**
5. **Look for failed requests** (they'll be red)

## Common Issues:

### Network Tab Errors:
- **CORS errors** - "Access-Control-Allow-Origin"
- **Connection refused** - Backend not running
- **404 errors** - Wrong API endpoint
- **500 errors** - Server error

### Console Tab Errors:
- **Failed to fetch** - Network connectivity
- **Unexpected token** - JSON parsing error
- **TypeError** - Frontend code error

## What to Look For:

1. **Request URL** - Should be http://localhost:3001/api/generate
2. **Request Method** - Should be POST
3. **Response Status** - Should be 200, not 404/500
4. **Response Body** - Any error messages

## Next Steps:

1. Check Network tab for the actual error
2. Check Console tab for JavaScript errors
3. Copy any error messages you see