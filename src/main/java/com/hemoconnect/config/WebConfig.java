package com.hemoconnect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${allowed.origins}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Enforce secure CORS policy (Taha Jaffri Rule 6)
        String[] origins = allowedOrigins.split(",");
        
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "Accept")
                .exposedHeaders("Retry-After")
                .allowCredentials(true)
                .maxAge(3600); // 1 hour caching of preflight requests
    }
}
