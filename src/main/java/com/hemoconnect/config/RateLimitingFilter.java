package com.hemoconnect.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter implements Filter {

    private final Map<String, TokenBucket> ipBuckets = new ConcurrentHashMap<>();

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initializer
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            String path = httpRequest.getRequestURI();

            // Ignore static resource files (CSS, JS, images) from rate limiting to allow fast rendering
            if (isStaticResource(path)) {
                chain.doFilter(request, response);
                return;
            }

            // Determine rate limit parameters based on the endpoint type (Taha Jaffri Rule 2)
            long capacity;
            long refillPeriodMs;

            if (path.contains("/api/auth") || path.contains("/login") || path.contains("/register") || path.contains("/verify")) {
                // Auth Limit: 5 requests per 15 minutes
                capacity = 5;
                refillPeriodMs = 15 * 60 * 1000;
            } else if (path.contains("/api/analytics") || path.contains("/api/ai") || path.contains("/api/emergency")) {
                // AI/High Computation Limit: 10 requests per minute
                capacity = 10;
                refillPeriodMs = 60 * 1000;
            } else if (path.contains("/upload")) {
                // Upload Limit: 5 requests per minute
                capacity = 5;
                refillPeriodMs = 60 * 1000;
            } else {
                // General API: 60 requests per minute
                capacity = 60;
                refillPeriodMs = 60 * 1000;
            }

            String clientKey = getClientIdentifier(httpRequest);
            String bucketKey = clientKey + ":" + getLimitCategory(path);
            TokenBucket bucket = ipBuckets.computeIfAbsent(bucketKey, k -> new TokenBucket(capacity, refillPeriodMs));

            if (!bucket.tryConsume()) {
                httpResponse.setStatus(429);
                httpResponse.setContentType("application/json");
                httpResponse.setHeader("Retry-After", String.valueOf(bucket.getRefillPeriodSeconds()));
                httpResponse.getWriter().write("{\"error\": \"Too many requests. Please wait before retrying.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // Cleanup
    }

    private String getClientIdentifier(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (!token.isEmpty()) {
                try {
                    // Hashing token using SHA-256 for user-based rate limit
                    java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                    byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    StringBuilder hexString = new StringBuilder();
                    for (byte b : hash) {
                        String hex = Integer.toHexString(0xff & b);
                        if (hex.length() == 1) hexString.append('0');
                        hexString.append(hex);
                    }
                    return "user:" + hexString.toString().substring(0, 16);
                } catch (Exception e) {
                    return "user:unknown";
                }
            }
        }
        return "ip:" + getClientIP(request);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private boolean isStaticResource(String path) {
        return path.endsWith(".css") || path.endsWith(".js") || path.endsWith(".png") ||
               path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".svg") ||
               path.endsWith(".ico") || path.endsWith(".html") || path.equals("/");
    }

    private String getLimitCategory(String path) {
        if (path.contains("/api/auth") || path.contains("/login") || path.contains("/register") || path.contains("/verify")) return "AUTH";
        if (path.contains("/api/analytics") || path.contains("/api/ai") || path.contains("/api/emergency")) return "AI";
        if (path.contains("/upload")) return "UPLOAD";
        return "GENERAL";
    }

    // Token Bucket implementation representing the rate limiter
    private static class TokenBucket {
        private final long capacity;
        private final long refillPeriodMs;
        private long tokens;
        private long lastRefillTimeMs;

        public TokenBucket(long capacity, long refillPeriodMs) {
            this.capacity = capacity;
            this.refillPeriodMs = refillPeriodMs;
            this.tokens = capacity;
            this.lastRefillTimeMs = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTimeMs;
            if (elapsed > refillPeriodMs) {
                tokens = capacity;
                lastRefillTimeMs = now;
            }
        }

        public long getRefillPeriodSeconds() {
            return refillPeriodMs / 1000;
        }
    }
}
