package com.hemoconnect.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${firebase.client.apiKey}")
    private String firebaseApiKey;

    @Value("${firebase.client.authDomain}")
    private String firebaseAuthDomain;

    @Value("${firebase.client.projectId}")
    private String firebaseProjectId;

    @Value("${firebase.client.storageBucket}")
    private String firebaseStorageBucket;

    @Value("${firebase.client.messagingSenderId}")
    private String firebaseMessagingSenderId;

    @Value("${firebase.client.appId}")
    private String firebaseAppId;

    @Value("${firebase.client.measurementId}")
    private String firebaseMeasurementId;

    @Value("${google.maps.apiKey}")
    private String googleMapsApiKey;

    @GetMapping("/firebase")
    public ResponseEntity<Map<String, String>> getFirebaseConfig() {
        return ResponseEntity.ok(Map.of(
            "apiKey", firebaseApiKey,
            "authDomain", firebaseAuthDomain,
            "projectId", firebaseProjectId,
            "storageBucket", firebaseStorageBucket,
            "messagingSenderId", firebaseMessagingSenderId,
            "appId", firebaseAppId,
            "measurementId", firebaseMeasurementId
        ));
    }

    @GetMapping("/maps-key")
    public ResponseEntity<Map<String, String>> getMapsKey() {
        return ResponseEntity.ok(Map.of("key", googleMapsApiKey));
    }
}
