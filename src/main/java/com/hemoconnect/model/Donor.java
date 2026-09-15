package com.hemoconnect.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class Donor {
    private String id;
    
    @NotBlank(message = "Full Name is required")
    @Size(min = 2, max = 100, message = "Full Name must be between 2 and 100 characters")
    private String fullName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9\\-\\s()]{7,17}$", message = "Invalid phone number format")
    private String phone;
    
    @NotBlank(message = "Blood group is required")
    @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Invalid blood group (e.g. A+, O-, AB+)")
    private String bloodGroup;
    
    @Min(value = 18, message = "Minimum age to donate is 18")
    @Max(value = 65, message = "Maximum age to donate is 65")
    private int age;
    @NotBlank(message = "Gender is required")
    private String gender;

    @NotBlank(message = "City is required")
    private String city;

    private String district;

    private boolean available = true;

    private String lastDonationDate; // Format: YYYY-MM-DD or empty

    private Long timestamp;

    private int donationCount = 0;
    private Double latitude;
    private Double longitude;
    private String source = "Local";

    public Donor() {
    }

    public Donor(String id, String fullName, String email, String phone, String bloodGroup, int age, String gender, String city, boolean available, String lastDonationDate, Long timestamp) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.bloodGroup = bloodGroup;
        this.age = age;
        this.gender = gender;
        this.city = city;
        this.available = available;
        this.lastDonationDate = lastDonationDate;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public String getLastDonationDate() {
        return lastDonationDate;
    }

    public void setLastDonationDate(String lastDonationDate) {
        this.lastDonationDate = lastDonationDate;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public int getDonationCount() {
        return donationCount;
    }

    public void setDonationCount(int donationCount) {
        this.donationCount = donationCount;
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

    public boolean isEligible() {
        if (lastDonationDate == null || lastDonationDate.trim().isEmpty()) {
            return true;
        }
        try {
            java.time.LocalDate last = java.time.LocalDate.parse(lastDonationDate.trim());
            java.time.LocalDate today = java.time.LocalDate.now();
            long days = java.time.temporal.ChronoUnit.DAYS.between(last, today);
            int required = getRequiredIntervalDays();
            return days >= required;
        } catch (Exception e) {
            return true; // Fallback if parsing fails
        }
    }

    public String getNextEligibleDate() {
        if (lastDonationDate == null || lastDonationDate.trim().isEmpty()) {
            return "";
        }
        try {
            java.time.LocalDate last = java.time.LocalDate.parse(lastDonationDate.trim());
            int required = getRequiredIntervalDays();
            return last.plusDays(required).toString();
        } catch (Exception e) {
            return "";
        }
    }

    public long getDaysUntilNextEligibility() {
        if (lastDonationDate == null || lastDonationDate.trim().isEmpty()) {
            return 0;
        }
        try {
            java.time.LocalDate last = java.time.LocalDate.parse(lastDonationDate.trim());
            java.time.LocalDate today = java.time.LocalDate.now();
            long daysPassed = java.time.temporal.ChronoUnit.DAYS.between(last, today);
            int required = getRequiredIntervalDays();
            if (daysPassed >= required) {
                return 0;
            } else {
                return required - daysPassed;
            }
        } catch (Exception e) {
            return 0;
        }
    }

    public String getDonationBadge() {
        if (donationCount <= 0) return "Newbie";
        if (donationCount >= 1 && donationCount <= 2) return "Bronze Lifesaver";
        if (donationCount >= 3 && donationCount <= 5) return "Silver Hero";
        if (donationCount >= 6 && donationCount <= 9) return "Gold Champion";
        return "Platinum Legend"; // 10+
    }

    private int getRequiredIntervalDays() {
        if (gender == null) return 90;
        String g = gender.toLowerCase();
        if (g.contains("woman") || g.contains("female") || g.contains("feminine")) {
            return 120;
        }
        return 90; // Default for men, masculine, other
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
