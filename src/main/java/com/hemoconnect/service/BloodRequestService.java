package com.hemoconnect.service;

import com.hemoconnect.model.BloodRequest;
import com.hemoconnect.model.Donor;
import com.hemoconnect.model.BloodBank;
import com.hemoconnect.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BloodRequestService {

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private SmartMatchingEngine matchingEngine;

    @Autowired
    private NotificationService notificationService;

    public List<BloodRequest> getAllRequests() throws Exception {
        return firebaseService.getAllRequests();
    }

    public BloodRequest getRequestById(String id) throws Exception {
        return firebaseService.getRequestById(id);
    }

    public BloodRequest createRequest(BloodRequest request) throws Exception {
        // Enforce validation and timestamps
        request.setStatus("PENDING");
        BloodRequest saved = firebaseService.saveRequest(request);

        // If this is an URGENT or CRITICAL request, trigger emergency notifications (Phase 12)
        if ("URGENT".equals(request.getEmergencyLevel()) || "CRITICAL".equals(request.getEmergencyLevel())) {
            triggerEmergencyDispatch(saved);
        }

        return saved;
    }

    public BloodRequest updateRequest(String id, BloodRequest request) throws Exception {
        BloodRequest existing = firebaseService.getRequestById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Blood request with ID " + id + " does not exist.");
        }
        request.setId(id);
        if (request.getTimestamp() == null) {
            request.setTimestamp(existing.getTimestamp());
        }
        return firebaseService.saveRequest(request);
    }

    public void deleteRequest(String id) throws Exception {
        firebaseService.deleteRequest(id);
    }

    public SmartMatchingEngine.ProximityMatchResult getMatchesForRequest(String requestId) throws Exception {
        BloodRequest request = getRequestById(requestId);
        if (request == null) {
            return new SmartMatchingEngine.ProximityMatchResult(new ArrayList<>(), new ArrayList<>(), false);
        }
        List<Donor> allDonors = firebaseService.getAllDonors();
        List<BloodBank> allBanks = firebaseService.getAllBloodBanks();

        String subLocation = null;
        if (request.getHospital() != null) {
            String hospLower = request.getHospital().toLowerCase();
            if (hospLower.contains("ghatkesar")) subLocation = "Ghatkesar";
            else if (hospLower.contains("secunderabad")) subLocation = "Secunderabad";
            else if (hospLower.contains("uppal")) subLocation = "Uppal";
            else if (hospLower.contains("gachibowli")) subLocation = "Gachibowli";
            else if (hospLower.contains("jubilee hills")) subLocation = "Jubilee Hills";
            else if (hospLower.contains("panjagutta")) subLocation = "Panjagutta";
        }

        return matchingEngine.searchProximityStockFirst(
                request.getBloodGroupRequired(),
                request.getCity(),
                subLocation,
                request.getUnitsRequired(),
                allBanks,
                allDonors
        );
    }

    private void triggerEmergencyDispatch(BloodRequest request) throws Exception {
        // 1. Log and trigger in-app notification
        String msg = String.format("EMERGENCY ALERT: %s request for %d units of %s at %s in %s!",
                request.getEmergencyLevel(), request.getUnitsRequired(),
                request.getBloodGroupRequired(), request.getHospital(), request.getCity());
        
        notificationService.createNotification(new Notification(null, msg, "ALERT", "ALL", System.currentTimeMillis()));

        // 2. Query matches and dispatch notifications
        List<Donor> allDonors = firebaseService.getAllDonors();
        List<SmartMatchingEngine.DonorMatch> matches = matchingEngine.findBestMatches(
                request.getBloodGroupRequired(), request.getCity(), allDonors);

        for (SmartMatchingEngine.DonorMatch match : matches) {
            // Dispatch notification specifically to matched donor (Phase 12)
            String matchMsg = String.format("HemoConnect Alert: You are a %s match for an emergency request at %s. Match Score: %.1f%%. Distance: %s.",
                    match.getCompatibility(), request.getHospital(), match.getMatchScore(), match.getDistance());
            
            notificationService.createNotification(new Notification(
                    null, matchMsg, "DONOR_MATCH", match.getDonor().getEmail(), System.currentTimeMillis()));

            // Send Email alert simulation
            notificationService.sendEmailNotification(match.getDonor().getEmail(), "Emergency Blood Need: HemoConnect", matchMsg);
        }
    }
}
