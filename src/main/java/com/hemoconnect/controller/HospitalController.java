package com.hemoconnect.controller;

import com.hemoconnect.model.Hospital;
import com.hemoconnect.service.FirebaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    @Autowired
    private FirebaseService firebaseService;

    @GetMapping
    public ResponseEntity<List<Hospital>> getAllHospitals() throws Exception {
        return ResponseEntity.ok(firebaseService.getAllHospitals());
    }

    @PostMapping
    public ResponseEntity<Hospital> registerHospital(@Valid @RequestBody Hospital hospital) throws Exception {
        // Issue cryptographic HAK if missing (Phase 4 & Auth rule)
        if (hospital.getHak() == null || hospital.getHak().isEmpty()) {
            hospital.setHak("hak-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        }
        Hospital saved = firebaseService.saveHospital(hospital);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // Secure Verification Endpoint (Better institutional login rule)
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyHospitalAccessKey(@RequestBody Map<String, String> credentials) throws Exception {
        String email = credentials.get("email");
        String hak = credentials.get("hak");

        if (email == null || hak == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and HAK coordinates are required."));
        }

        List<Hospital> hospitals = firebaseService.getAllHospitals();
        for (Hospital h : hospitals) {
            if (h.getCorporateEmail().equalsIgnoreCase(email.trim()) && h.getHak().equals(hak.trim())) {
                // Successful verification
                return ResponseEntity.ok(Map.of(
                        "status", "VERIFIED",
                        "hospitalName", h.getHospitalName(),
                        "location", h.getLocation(),
                        "token", "mock-token-hospital" // Client uses this token for subsequent auth headers
                ));
            }
        }

        // Taha Jaffri Rule 9: Return safe generic failure message
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Access Denied: Invalid corporate credentials or key."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHospital(@PathVariable String id) throws Exception {
        firebaseService.deleteHospital(id);
        return ResponseEntity.noContent().build();
    }
}
