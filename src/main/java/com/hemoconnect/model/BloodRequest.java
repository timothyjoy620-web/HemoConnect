package com.hemoconnect.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class BloodRequest {
    private String id;
    
    @NotBlank(message = "Patient Name is required")
    private String patientName;
    
    @NotBlank(message = "Blood group required is required")
    @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Invalid blood group (e.g. A+, O-, AB+)")
    private String bloodGroupRequired;
    
    @Min(value = 1, message = "Minimum units required is 1")
    @Max(value = 20, message = "Maximum units required in a single request is 20")
    private int unitsRequired;
    
    @NotBlank(message = "Hospital is required")
    private String hospital;
    
    @NotBlank(message = "Emergency level is required")
    @Pattern(regexp = "^(ROUTINE|URGENT|CRITICAL)$", message = "Invalid level (must be ROUTINE, URGENT, or CRITICAL)")
    private String emergencyLevel;
    
    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^\\+?[0-9\\-\\s()]{7,17}$", message = "Invalid contact phone number format")
    private String contactNumber;
    
    @NotBlank(message = "City is required")
    private String city;
    
    private String status = "PENDING"; // PENDING, ACTIVE, COMPLETED, CANCELLED
    
    private Long timestamp;
    private Double latitude;
    private Double longitude;

    public BloodRequest() {
    }

    public BloodRequest(String id, String patientName, String bloodGroupRequired, int unitsRequired, String hospital, String emergencyLevel, String contactNumber, String city, String status, Long timestamp) {
        this.id = id;
        this.patientName = patientName;
        this.bloodGroupRequired = bloodGroupRequired;
        this.unitsRequired = unitsRequired;
        this.hospital = hospital;
        this.emergencyLevel = emergencyLevel;
        this.contactNumber = contactNumber;
        this.city = city;
        this.status = status;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getBloodGroupRequired() {
        return bloodGroupRequired;
    }

    public void setBloodGroupRequired(String bloodGroupRequired) {
        this.bloodGroupRequired = bloodGroupRequired;
    }

    public int getUnitsRequired() {
        return unitsRequired;
    }

    public void setUnitsRequired(int unitsRequired) {
        this.unitsRequired = unitsRequired;
    }

    public String getHospital() {
        return hospital;
    }

    public void setHospital(String hospital) {
        this.hospital = hospital;
    }

    public String getEmergencyLevel() {
        return emergencyLevel;
    }

    public void setEmergencyLevel(String emergencyLevel) {
        this.emergencyLevel = emergencyLevel;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
}
