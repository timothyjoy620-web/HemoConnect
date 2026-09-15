package com.hemoconnect.controller;

import com.hemoconnect.model.BloodRequest;
import com.hemoconnect.service.BloodRequestService;
import com.hemoconnect.service.SmartMatchingEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

import com.hemoconnect.service.FirebaseService;

@RestController
@RequestMapping("/api/requests")
public class BloodRequestController {

    @Autowired
    private BloodRequestService requestService;

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private SmartMatchingEngine matchingEngine;

    @GetMapping
    public ResponseEntity<List<BloodRequest>> getAllRequests() throws Exception {
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BloodRequest> getRequestById(@PathVariable String id) throws Exception {
        BloodRequest request = requestService.getRequestById(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(request);
    }

    @PostMapping
    public ResponseEntity<BloodRequest> createRequest(@Valid @RequestBody BloodRequest request) throws Exception {
        BloodRequest saved = requestService.createRequest(request);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BloodRequest> updateRequest(@PathVariable String id, @Valid @RequestBody BloodRequest request) throws Exception {
        try {
            BloodRequest updated = requestService.updateRequest(id, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable String id) throws Exception {
        requestService.deleteRequest(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoint for fetching donor matches (Phase 9)
    @GetMapping("/{id}/matches")
    public ResponseEntity<SmartMatchingEngine.ProximityMatchResult> getRequestMatches(@PathVariable String id) throws Exception {
        return ResponseEntity.ok(requestService.getMatchesForRequest(id));
    }

    @GetMapping("/search-match")
    public ResponseEntity<SmartMatchingEngine.ProximityMatchResult> searchMatch(
            @RequestParam String bloodGroup,
            @RequestParam String city,
            @RequestParam(required = false) String subLocation,
            @RequestParam(defaultValue = "1") int units) throws Exception {
        
        List<com.hemoconnect.model.Donor> allDonors = firebaseService.getAllDonors();
        List<com.hemoconnect.model.BloodBank> allBanks = firebaseService.getAllBloodBanks();
        
        SmartMatchingEngine.ProximityMatchResult result = matchingEngine.searchProximityStockFirst(
                bloodGroup, city, subLocation, units, allBanks, allDonors);
        
        return ResponseEntity.ok(result);
    }
}
