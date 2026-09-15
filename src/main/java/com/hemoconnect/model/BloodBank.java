package com.hemoconnect.model;

import jakarta.validation.constraints.NotBlank;
import java.util.HashMap;
import java.util.Map;

public class BloodBank {
    private String id;
    
    @NotBlank(message = "Blood Bank Name is required")
    private String name;
    
    private String type; // e.g. Government, Private, Charitable/Vol, Red Cross
    
    @NotBlank(message = "Address is required")
    private String address;
    
    private String city;
    private String subLocation; // Neighborhood/Sector
    private String district;
    private Double distanceKm;
    private String contactNumber;
    private String email;
    private Boolean isActive = true;
    private Double latitude;
    private Double longitude;
    private String state;
    
    // Blood Inventory mapping: Group (e.g. A+, AB-) -> Units (Integer)
    private Map<String, Integer> bloodInventory = new HashMap<>();
    
    private String bak; // Blood Bank Access Key (Institutional authorization key)
    private Long timestamp;

    public BloodBank() {
        // Initialize basic empty inventory
        String[] groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};
        for (String group : groups) {
            this.bloodInventory.put(group, 0);
        }
    }

    public BloodBank(String id, String name, String type, String address, String city, String subLocation, 
                     String district, Double distanceKm, String contactNumber, String email, 
                     Map<String, Integer> bloodInventory, String bak, Long timestamp) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.address = address;
        this.city = city;
        this.subLocation = subLocation;
        this.district = district;
        this.distanceKm = distanceKm;
        this.contactNumber = contactNumber;
        this.email = email;
        if (bloodInventory != null) {
            this.bloodInventory = bloodInventory;
        }
        this.bak = bak;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getSubLocation() {
        return subLocation;
    }

    public void setSubLocation(String subLocation) {
        this.subLocation = subLocation;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Map<String, Integer> getBloodInventory() {
        return bloodInventory;
    }

    public void setBloodInventory(Map<String, Integer> bloodInventory) {
        this.bloodInventory = bloodInventory;
    }

    public String getBak() {
        return bak;
    }

    public void setBak(String bak) {
        this.bak = bak;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Map<String, Integer> getInventory() {
        return bloodInventory;
    }

    public void setInventory(Map<String, Integer> inventory) {
        this.bloodInventory = inventory;
    }
}
