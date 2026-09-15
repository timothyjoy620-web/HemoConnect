package com.hemoconnect.controller;

import com.hemoconnect.model.BloodRequest;
import com.hemoconnect.service.BloodRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    @Autowired
    private BloodRequestService requestService;

    // Phase 6 & Phase 12: Trigger emergency requests
    @PostMapping
    public ResponseEntity<BloodRequest> triggerEmergency(@Valid @RequestBody BloodRequest request) throws Exception {
        // Enforce critical parameters for emergency routes
        request.setEmergencyLevel("CRITICAL");
        BloodRequest saved = requestService.createRequest(request);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
}
