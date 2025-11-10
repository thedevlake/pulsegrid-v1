# Debug Dashboard Issues

## Steps to Debug:

1. **Open Browser Console (F12)**
   - Look for any red errors
   - Check for "Fetching overview..." log
   - Check for "Overview response:" log
   - Look for any network errors

2. **Check Network Tab**
   - Go to Network tab in browser dev tools
   - Look for request to `/api/v1/stats/overview`
   - Check the status code (should be 200)
   - Check the response

3. **Check if you're logged in:**
   - Open browser console
   - Run: `JSON.parse(localStorage.getItem('auth-storage'))`
   - Should show token and user data

4. **Test API manually:**
   - In browser console, run:
   ```javascript
   fetch('http://localhost:8080/api/v1/stats/overview', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN_HERE'
     }
   }).then(r => r.json()).then(console.log)
   ```

## Common Issues:

- **401 Unauthorized**: Token expired or invalid
- **404 Not Found**: Backend route doesn't exist
- **CORS Error**: Backend CORS not configured correctly
- **Network Error**: Backend not running
