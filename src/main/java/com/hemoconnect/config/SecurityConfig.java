package com.hemoconnect.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class SecurityConfig implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initializer
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            String path = httpRequest.getRequestURI();

            // Set secure HTTP headers (Taha Jaffri Rule 7)
            setSecurityHeaders(httpResponse);

            // Bypass authentication for public resources
            if (isPublicPath(path)) {
                chain.doFilter(request, response);
                return;
            }

            // Extract Bearer token from Authorization header
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                // Deny access if missing token for secured API routes
                if (path.startsWith("/api/")) {
                    sendUnauthorized(httpResponse, "Missing or invalid authorization token.");
                    return;
                }
                chain.doFilter(request, response);
                return;
            }

            String idToken = authHeader.substring(7);
            String email = null;
            String role = "USER";

            if (FirebaseConfig.isMockMode()) {
                // Mock Mode Token verification (e.g. "mock-token-admin", "mock-token-donor")
                if (idToken.equals("mock-token-admin")) {
                    email = "admin@hemoconnect.org";
                    role = "ADMIN";
                } else if (idToken.equals("mock-token-hospital")) {
                    email = "admin@stjude.org";
                    role = "HOSPITAL";
                } else if (idToken.equals("mock-token-donor")) {
                    email = "james.wilson@mail.com";
                    role = "DONOR";
                } else if (idToken.contains("mock-token-phone")) {
                    email = "phone-user@hemoconnect.org";
                    role = "DONOR";
                } else {
                    // Fallback to donor role for other mock tokens (like mock-token-google) or real tokens in mock mode
                    email = "guest-user@hemoconnect.org";
                    role = "DONOR";
                }
            } else {
                // Real Firebase token verification (Phase 8)
                try {
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                    email = decodedToken.getEmail();
                    
                    // Simple custom claim check, or check database mapping
                    if (email != null && email.endsWith("@hemoconnect.org")) {
                        role = "ADMIN";
                    } else if (email != null && (email.endsWith(".org") || email.endsWith(".gov") || email.contains("hospital"))) {
                        role = "HOSPITAL";
                    } else {
                        role = "DONOR";
                    }
                } catch (Exception e) {
                    sendUnauthorized(httpResponse, "Firebase token verification failed: " + e.getMessage());
                    return;
                }
            }

            // Set user context details on request
            httpRequest.setAttribute("userEmail", email);
            httpRequest.setAttribute("userRole", role);

            // Enforce role-based access control (RBAC) (Rule 4)
            if (path.startsWith("/api/admin") && !role.equals("ADMIN")) {
                sendForbidden(httpResponse, "Access Denied: Administrative privileges required.");
                return;
            }
            
            if (path.startsWith("/api/emergency") && !(role.equals("HOSPITAL") || role.equals("ADMIN"))) {
                sendForbidden(httpResponse, "Access Denied: Institutional access required for emergency dispatch.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        // Public API endpoints
        if (path.equals("/api/donors") && "POST".equals("POST")) {
            // Permit registration
            return true;
        }
        return path.startsWith("/api/hospitals") || 
               path.startsWith("/api/bloodbanks") || 
               path.equals("/api/analytics") ||
               path.equals("/api/admin/seed") || // Seeder accessible for hackathon demo
               path.equals("/api/donors/search-external") || // Expose voluntary donor search as public
               path.startsWith("/api/config") || // Expose dynamic key/credentials configs
               !path.startsWith("/api/"); // Static website resources
    }

    private void setSecurityHeaders(HttpServletResponse response) {
        // HTTP Security Headers (Taha Jaffri Rule 7)
        response.setHeader("Content-Security-Policy", "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.tailwindcss.com https://lh3.googleusercontent.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://www.gstatic.com https://maps.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://lh3.googleusercontent.com https://maps.gstatic.com https://*.googleapis.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; frame-src 'self' https://*.firebaseapp.com; frame-ancestors 'none';");
        response.setHeader("X-Frame-Options", "DENY"); // Clickjacking protection
        response.setHeader("X-Content-Type-Options", "nosniff"); // MIME sniffing protection
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains"); // Force HTTPS
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        // Remove X-Powered-By is done by omitting it or overriding if servlet container sets it
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(401);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

    private void sendForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(403);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

    @Override
    public void destroy() {
        // Cleanup
    }
}
