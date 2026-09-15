package com.hemoconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HemoConnectApplication {
    public static void main(String[] args) {
        System.out.println("[HemoConnect] Commencing application launch sequence...");
        SpringApplication.run(HemoConnectApplication.class, args);
        System.out.println("[HemoConnect] Platform active and monitoring on http://localhost:8080");
    }
}
