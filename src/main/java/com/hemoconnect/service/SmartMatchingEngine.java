package com.hemoconnect.service;

import com.hemoconnect.model.Donor;
import com.hemoconnect.model.BloodBank;
import java.util.Map;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Random;

@Service
public class SmartMatchingEngine {

    private final Random random = new Random();

    // DTO to represent a match result (Phase 9)
    public static class DonorMatch implements Comparable<DonorMatch> {
        private Donor donor;
        private double matchScore; // Percentage (e.g., 95.5)
        private String distance; // e.g. "2.4 km"
        private String compatibility; // "Exact Match", "Compatible Match"

        public DonorMatch() {}

        public DonorMatch(Donor donor, double matchScore, String distance, String compatibility) {
            this.donor = donor;
            this.matchScore = matchScore;
            this.distance = distance;
            this.compatibility = compatibility;
        }

        public Donor getDonor() { return donor; }
        public void setDonor(Donor donor) { this.donor = donor; }
        public double getMatchScore() { return matchScore; }
        public void setMatchScore(double matchScore) { this.matchScore = matchScore; }
        public String getDistance() { return distance; }
        public void setDistance(String distance) { this.distance = distance; }
        public String getCompatibility() { return compatibility; }
        public void setCompatibility(String compatibility) { this.compatibility = compatibility; }

        @Override
        public int compareTo(DonorMatch other) {
            return Double.compare(other.matchScore, this.matchScore); // Descending order of score
        }
    }

    public List<DonorMatch> findBestMatches(String requiredGroup, String city, List<Donor> donors) {
        List<DonorMatch> matches = new ArrayList<>();
        
        for (Donor donor : donors) {
            // Rule 3: Check donor availability status
            if (!donor.isAvailable()) {
                continue;
            }

            // Rule 3b: Check biological eligibility interval (90/120 days)
            if (!donor.isEligible()) {
                continue;
            }

            // Rule 2: Filter by city (case-insensitive)
            if (!donor.getCity().equalsIgnoreCase(city)) {
                continue;
            }

            // Rule 1: Match blood group compatibility
            if (!isCompatible(donor.getBloodGroup(), requiredGroup)) {
                continue;
            }

            // Calculate simulated details
            double dist = 1.0 + (random.nextDouble() * 14.0); // Random distance between 1.0 km and 15.0 km
            String distanceStr = String.format(Locale.US, "%.1f km", dist);
            
            String compatibilityStr = donor.getBloodGroup().equals(requiredGroup) ? "Exact Match" : "Compatible Match";

            // Compute score (Phase 9):
            // Base compatibility = 60 points
            // Exact match = +10 points
            // Proximity = up to 30 points (decreases with distance)
            double proximityScore = 30.0 * (1.0 - (dist / 15.0));
            double compatibilityScore = donor.getBloodGroup().equals(requiredGroup) ? 70.0 : 60.0;
            double matchScore = Math.min(100.0, Math.max(0.0, compatibilityScore + proximityScore));

            // Clean format
            matchScore = Math.round(matchScore * 10.0) / 10.0;

            matches.add(new DonorMatch(donor, matchScore, distanceStr, compatibilityStr));
        }

        // Rank nearest / best matches (Rule 4 & Phase 9)
        Collections.sort(matches);
        return matches;
    }

    public boolean isCompatible(String donorGroup, String recipientGroup) {
        if (donorGroup == null || recipientGroup == null) return false;
        
        // Remove trailing spaces, standardize
        donorGroup = donorGroup.trim().toUpperCase();
        recipientGroup = recipientGroup.trim().toUpperCase();

        // O- is universal donor (can donate to all groups)
        if (donorGroup.equals("O-")) return true;

        // O+ can donate to any positive group
        if (donorGroup.equals("O+")) {
            return recipientGroup.endsWith("+");
        }

        // AB+ is universal recipient (can receive from all groups)
        if (recipientGroup.equals("AB+")) return true;

        // Exact match is always compatible
        if (donorGroup.equals(recipientGroup)) return true;

        // ABO group compatibility logic
        String donorABO = donorGroup.substring(0, donorGroup.length() - 1);
        String recipientABO = recipientGroup.substring(0, recipientGroup.length() - 1);
        
        boolean donorRh = donorGroup.endsWith("+");
        boolean recipientRh = recipientGroup.endsWith("+");

        // Rh constraint: negative cannot receive positive
        if (donorRh && !recipientRh) {
            return false;
        }

        // ABO rules
        if (donorABO.equals("O")) return true; // O can donate to A, B, AB
        if (donorABO.equals("A")) return recipientABO.equals("A") || recipientABO.equals("AB");
        if (donorABO.equals("B")) return recipientABO.equals("B") || recipientABO.equals("AB");
        
        return false; // AB donor can only donate to AB recipient (already covered by exact match/universal recipient)
    }

    public static class BloodBankMatch {
        private BloodBank bloodBank;
        private int availableUnits;

        public BloodBankMatch() {}
        public BloodBankMatch(BloodBank bloodBank, int availableUnits) {
            this.bloodBank = bloodBank;
            this.availableUnits = availableUnits;
        }
        public BloodBank getBloodBank() { return bloodBank; }
        public void setBloodBank(BloodBank bloodBank) { this.bloodBank = bloodBank; }
        public int getAvailableUnits() { return availableUnits; }
        public void setAvailableUnits(int availableUnits) { this.availableUnits = availableUnits; }
    }

    public static class ProximityMatchResult {
        private List<BloodBankMatch> clinics;
        private List<DonorMatch> donors;
        private boolean escalated;

        public ProximityMatchResult() {}
        public ProximityMatchResult(List<BloodBankMatch> clinics, List<DonorMatch> donors, boolean escalated) {
            this.clinics = clinics;
            this.donors = donors;
            this.escalated = escalated;
        }
        public List<BloodBankMatch> getClinics() { return clinics; }
        public void setClinics(List<BloodBankMatch> clinics) { this.clinics = clinics; }
        public List<DonorMatch> getDonors() { return donors; }
        public void setDonors(List<DonorMatch> donors) { this.donors = donors; }
        public boolean isEscalated() { return escalated; }
        public void setEscalated(boolean escalated) { this.escalated = escalated; }
    }

    public ProximityMatchResult searchProximityStockFirst(
            String requiredGroup, 
            String city, 
            String subLocation, 
            int unitsRequired, 
            List<BloodBank> bloodBanks, 
            List<Donor> donors) {
        
        ProximityMatchResult result = new ProximityMatchResult();
        List<BloodBankMatch> clinicsMatches = new ArrayList<>();
        List<DonorMatch> donorMatches = new ArrayList<>();
        
        // 1. Search blood banks/hospitals first in the same subLocation or city
        int totalAvailableStock = 0;
        for (BloodBank bank : bloodBanks) {
            boolean cityMatch = bank.getCity() != null && bank.getCity().equalsIgnoreCase(city);
            boolean subMatch = subLocation == null || subLocation.isEmpty() || 
                             (bank.getSubLocation() != null && bank.getSubLocation().equalsIgnoreCase(subLocation));
            
            if (cityMatch && subMatch) {
                Map<String, Integer> inventory = bank.getBloodInventory();
                if (inventory != null && inventory.containsKey(requiredGroup)) {
                    int available = inventory.get(requiredGroup);
                    if (available > 0) {
                        totalAvailableStock += available;
                        clinicsMatches.add(new BloodBankMatch(bank, available));
                    }
                }
            }
        }
        
        result.setClinics(clinicsMatches);
        
        // 2. Escalate if total available stock is less than required units
        boolean needsEscalation = totalAvailableStock < unitsRequired;
        result.setEscalated(needsEscalation);
        
        // Find compatible donors in the subLocation or city
        for (Donor donor : donors) {
            if (!donor.isAvailable()) continue;
            if (!donor.isEligible()) continue;
            
            boolean cityMatch = donor.getCity() != null && donor.getCity().equalsIgnoreCase(city);
            boolean subMatch = subLocation == null || subLocation.isEmpty() || 
                             (donor.getDistrict() != null && donor.getDistrict().equalsIgnoreCase(subLocation));
            
            if (cityMatch && subMatch && isCompatible(donor.getBloodGroup(), requiredGroup)) {
                double dist = 1.0 + (random.nextDouble() * 9.0);
                String distStr = String.format(Locale.US, "%.1f km", dist);
                String compatibility = donor.getBloodGroup().equals(requiredGroup) ? "Exact Match" : "Compatible Match";
                double score = donor.getBloodGroup().equals(requiredGroup) ? 90.0 : 80.0;
                score += (10.0 * (1.0 - (dist / 10.0)));
                score = Math.round(score * 10.0) / 10.0;
                
                donorMatches.add(new DonorMatch(donor, score, distStr, compatibility));
            }
        }
        
        Collections.sort(donorMatches);
        result.setDonors(donorMatches);
        
        return result;
    }
}
