package com.hemoconnect.controller;

import com.hemoconnect.service.FirebaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private FirebaseService firebaseService;

    // Phase 16: Seeding demo data
    @PostMapping("/seed")
    public ResponseEntity<Map<String, String>> seedDemoData() {
        try {
            firebaseService.resetAndSeedDemoData();
            return ResponseEntity.ok(Map.of("message", "Database successfully reset and seeded with hackathon demo data."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to seed data: " + e.getMessage()));
        }
    }

    // CORS proxy endpoint to fetch JSON data from external blood bank API registries
    @org.springframework.web.bind.annotation.GetMapping("/fetch-external")
    public ResponseEntity<?> fetchExternalData(@org.springframework.web.bind.annotation.RequestParam String url) {
        if (url == null || url.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "URL parameter is required."));
        }

        // Strict SSRF Prevention Check
        if (!isSafeUrl(url)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Access Denied: The specified URL is restricted or invalid for SSRF security reasons."));
        }

        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .timeout(java.time.Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                return ResponseEntity.ok()
                        .header("Content-Type", "application/json")
                        .body(response.body());
            } else {
                return ResponseEntity.status(response.statusCode())
                        .body(Map.of("error", "External URL returned status " + response.statusCode()));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch external resource: " + e.getMessage()));
        }
    }

    private boolean isSafeUrl(String urlString) {
        try {
            java.net.URI uri = java.net.URI.create(urlString);
            String scheme = uri.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                return false;
            }
            String host = uri.getHost();
            if (host == null || host.trim().isEmpty()) {
                return false;
            }
            
            // Resolve host to IP addresses to prevent local/private network access (SSRF protection)
            java.net.InetAddress[] addresses = java.net.InetAddress.getAllByName(host);
            for (java.net.InetAddress addr : addresses) {
                if (addr.isLoopbackAddress() || 
                    addr.isAnyLocalAddress() || 
                    addr.isLinkLocalAddress() || 
                    addr.isSiteLocalAddress() ||
                    addr.getHostAddress().startsWith("169.254")) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
