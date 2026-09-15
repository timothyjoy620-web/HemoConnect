package com.hemoconnect.service;

import com.hemoconnect.model.BloodBank;
import com.hemoconnect.model.BloodRequest;
import com.hemoconnect.model.Donor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    @Autowired
    private FirebaseService firebaseService;

    // DTO for dashboard metrics (Phase 10)
    public static class AnalyticsPayload {
        private long totalDonors;
        private long activeDonors;
        private long emergencyRequests;
        private Map<String, Integer> bloodGroupDistribution = new HashMap<>();
        private Map<String, Integer> donationTrends = new HashMap<>();
        private Map<String, Integer> cityWiseAnalytics = new HashMap<>();
        private Map<String, Integer> bloodBankInventory = new HashMap<>();

        public AnalyticsPayload() {}

        // Getters and Setters
        public long getTotalDonors() { return totalDonors; }
        public void setTotalDonors(long totalDonors) { this.totalDonors = totalDonors; }
        public long getActiveDonors() { return activeDonors; }
        public void setActiveDonors(long activeDonors) { this.activeDonors = activeDonors; }
        public long getEmergencyRequests() { return emergencyRequests; }
        public void setEmergencyRequests(long emergencyRequests) { this.emergencyRequests = emergencyRequests; }
        public Map<String, Integer> getBloodGroupDistribution() { return bloodGroupDistribution; }
        public void setBloodGroupDistribution(Map<String, Integer> bloodGroupDistribution) { this.bloodGroupDistribution = bloodGroupDistribution; }
        public Map<String, Integer> getDonationTrends() { return donationTrends; }
        public void setDonationTrends(Map<String, Integer> donationTrends) { this.donationTrends = donationTrends; }
        public Map<String, Integer> getCityWiseAnalytics() { return cityWiseAnalytics; }
        public void setCityWiseAnalytics(Map<String, Integer> cityWiseAnalytics) { this.cityWiseAnalytics = cityWiseAnalytics; }
        public Map<String, Integer> getBloodBankInventory() { return bloodBankInventory; }
        public void setBloodBankInventory(Map<String, Integer> bloodBankInventory) { this.bloodBankInventory = bloodBankInventory; }
    }

    public AnalyticsPayload getAnalytics() throws Exception {
        AnalyticsPayload payload = new AnalyticsPayload();
        
        List<Donor> donors = firebaseService.getAllDonors();
        List<BloodRequest> requests = firebaseService.getAllRequests();
        List<BloodBank> banks = firebaseService.getAllBloodBanks();

        // 1. Basic Counts
        payload.setTotalDonors(donors.size());
        payload.setActiveDonors(donors.stream().filter(Donor::isAvailable).count());
        payload.setEmergencyRequests(requests.stream().filter(r -> "URGENT".equals(r.getEmergencyLevel()) || "CRITICAL".equals(r.getEmergencyLevel())).count());

        // 2. Blood Group Distribution
        for (Donor d : donors) {
            String group = d.getBloodGroup();
            payload.getBloodGroupDistribution().put(group, payload.getBloodGroupDistribution().getOrDefault(group, 0) + 1);
        }

        // Initialize default blood groups if empty
        String[] groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};
        for (String group : groups) {
            payload.getBloodGroupDistribution().putIfAbsent(group, 0);
            payload.getBloodBankInventory().put(group, 0);
        }

        // 3. Donation Trends (Mock aggregation by monthly buckets based on last donation timestamp/strings)
        payload.getDonationTrends().put("Jan", 4);
        payload.getDonationTrends().put("Feb", 8);
        payload.getDonationTrends().put("Mar", 12);
        payload.getDonationTrends().put("Apr", 9);
        payload.getDonationTrends().put("May", 15);
        payload.getDonationTrends().put("Jun", 19);

        // 4. City-wise Analytics
        for (Donor d : donors) {
            String city = d.getCity();
            payload.getCityWiseAnalytics().put(city, payload.getCityWiseAnalytics().getOrDefault(city, 0) + 1);
        }

        // 5. Blood Bank Inventory (Aggregated units from all blood banks)
        for (BloodBank bank : banks) {
            if (bank.getBloodInventory() != null) {
                for (Map.Entry<String, Integer> entry : bank.getBloodInventory().entrySet()) {
                    String group = entry.getKey();
                    int units = entry.getValue();
                    payload.getBloodBankInventory().put(group, payload.getBloodBankInventory().getOrDefault(group, 0) + units);
                }
            }
        }

        return payload;
    }
}
