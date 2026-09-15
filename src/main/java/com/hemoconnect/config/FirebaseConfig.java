package com.hemoconnect.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials.path}")
    private String credentialsPath;

    @Value("${firebase.credentials.json}")
    private String credentialsJson;

    private static boolean useMock = false;

    @PostConstruct
    public void initialize() {
        try {
            InputStream serviceAccount = null;

            // 1. Try loading credentials directly from the environment JSON variable
            if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
                System.out.println("[FirebaseConfig] Initializing Firebase Admin SDK via env JSON credentials...");
                serviceAccount = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8));
            } else {
                // 2. Try loading from file path
                String path = credentialsPath;
                if (path.startsWith("classpath:")) {
                    String resourceName = path.substring("classpath:".length());
                    serviceAccount = getClass().getClassLoader().getResourceAsStream(resourceName);
                } else {
                    if (Files.exists(Paths.get(path))) {
                        serviceAccount = Files.newInputStream(Paths.get(path));
                    }
                }
            }

            if (serviceAccount == null) {
                throw new Exception("No credential files or variables could be resolved.");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            System.out.println("[FirebaseConfig] Firebase Admin SDK successfully initialized!");
            useMock = false;
        } catch (Exception e) {
            System.err.println("[FirebaseConfig] WARNING: Failed to initialize Firebase Admin SDK: " + e.getMessage());
            System.err.println("[FirebaseConfig] --- HEMOCONNECT IS RUNNING IN LOCAL HACKATHON DEMO MODE (IN-MEMORY MOCK DATABASE) ---");
            useMock = true;
        }
    }

    public static boolean isMockMode() {
        return useMock;
    }
}
