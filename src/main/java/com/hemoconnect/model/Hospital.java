package com.hemoconnect.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class Hospital {
    private String id;
    
    @NotBlank(message = "Hospital Name is required")
    private String hospitalName;
    
    @NotBlank(message = "Location is required")
    private String location; // City or full coordinates address

    @NotBlank(message = "Emergency Contact is required")
    @Pattern(regexp = "^\\+?[0-9\\-\\s()]{7,17}$", message = "Invalid contact phone number format")
    private String emergencyContact;

    private String address;
    private String city;
    private String district;
    private String contactNumber;

    @NotBlank(message = "Corporate email is required")
    @Email(message = "Invalid email format")
    private String corporateEmail;

    private String hak; // Hospital Access Key (Secure cryptographic token issued to the hospital)

    private Long timestamp;

    public Hospital() {
    }

    public Hospital(String id, String hospitalName, String location, String emergencyContact, String corporateEmail, String hak, Long timestamp) {
        this.id = id;
        this.hospitalName = hospitalName;
        this.location = location;
        this.emergencyContact = emergencyContact;
        this.corporateEmail = corporateEmail;
        this.hak = hak;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public String getCorporateEmail() {
        return corporateEmail;
    }

    public void setCorporateEmail(String corporateEmail) {
        this.corporateEmail = corporateEmail;
    }

    public String getHak() {
        return hak;
    }

    public void setHak(String hak) {
        this.hak = hak;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
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

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }
}
