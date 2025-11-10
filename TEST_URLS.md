# Test URLs for PulseGrid Monitoring

This document provides URLs you can use to test your monitoring system with different scenarios.

## Always Up (Reliable Services)

These should always return 200 OK:

- `https://www.google.com` - Google homepage
- `https://www.github.com` - GitHub
- `https://httpbin.org/get` - HTTP testing service
- `https://jsonplaceholder.typicode.com/posts/1` - JSON API test endpoint
- `https://www.cloudflare.com` - Cloudflare

## Simulated Down/Error Scenarios

### HTTP Status Code Testing

Use `httpstat.us` to test different HTTP status codes:

- `https://httpstat.us/200` - Returns 200 OK (good for testing)
- `https://httpstat.us/404` - Returns 404 Not Found (simulates missing page)
- `https://httpstat.us/500` - Returns 500 Internal Server Error (simulates server error)
- `https://httpstat.us/503` - Returns 503 Service Unavailable (simulates downtime)
- `https://httpstat.us/504` - Returns 504 Gateway Timeout (simulates timeout)

### Delayed Responses (Timeout Testing)

- `https://httpstat.us/200?sleep=5000` - Returns 200 after 5 seconds (test timeout)
- `https://httpstat.us/200?sleep=10000` - Returns 200 after 10 seconds (test timeout)

### Actually Down/Unreliable URLs

These are known to be unreliable or intentionally down:

- `http://httpstat.us/503` - Service Unavailable
- `https://httpstat.us/503` - Service Unavailable (HTTPS)
- `http://example.com/nonexistent-page-404` - 404 error
- `https://httpstat.us/500` - Server error

## Local Testing Setup

For more control, you can set up a local test server:

### Option 1: Simple Python HTTP Server (with errors)

```python
# test_server.py
from http.server import HTTPServer, BaseHTTPRequestHandler
import random
import time

class TestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Randomly return errors for testing
        rand = random.random()
        
        if rand < 0.3:  # 30% chance of error
            self.send_response(500)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'Server Error')
        elif rand < 0.5:  # 20% chance of slow response
            time.sleep(3)
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'OK (slow)')
        else:  # 50% chance of success
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'OK')

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), TestHandler)
    print('Test server running on http://localhost:8000')
    server.serve_forever()
```

Run with: `python3 test_server.py`

Then monitor: `http://localhost:8000`

### Option 2: Node.js Test Server

```javascript
// test-server.js
const http = require('http');

const server = http.createServer((req, res) => {
  const rand = Math.random();
  
  if (rand < 0.3) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server Error');
  } else if (rand < 0.5) {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK (slow)');
    }, 3000);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  }
});

server.listen(8000, () => {
  console.log('Test server running on http://localhost:8000');
});
```

Run with: `node test-server.js`

## Recommended Test Sequence

1. **Start with reliable services** (Google, GitHub) to verify basic functionality
2. **Test error codes** using httpstat.us endpoints
3. **Test timeouts** using delayed responses
4. **Test actual down services** using 503/500 endpoints
5. **Set up local test server** for controlled testing

## Quick Test Commands

Add these services to your PulseGrid dashboard:

```bash
# Good service (should always be up)
Name: Google
URL: https://www.google.com
Type: HTTP
Interval: 60s
Timeout: 10s

# Simulated down service
Name: Test 503 Error
URL: https://httpstat.us/503
Type: HTTP
Interval: 60s
Timeout: 10s

# Simulated timeout
Name: Test Timeout
URL: https://httpstat.us/200?sleep=15000
Type: HTTP
Interval: 60s
Timeout: 10s

# 404 Error
Name: Test 404
URL: https://httpstat.us/404
Type: HTTP
Interval: 60s
Timeout: 10s
```

## Notes

- `httpstat.us` is a free service designed for HTTP status code testing
- Some endpoints may have rate limits
- For production testing, use your own controlled endpoints
- Always respect rate limits and terms of service when testing external URLs

