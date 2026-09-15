package com.hemoconnect.service;

import com.hemoconnect.model.Donor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DonorService {

    @Autowired
    private FirebaseService firebaseService;

    public List<Donor> getAllDonors() throws Exception {
        return firebaseService.getAllDonors();
    }

    public Donor getDonorById(String id) throws Exception {
        return firebaseService.getDonorById(id);
    }

    public Donor registerDonor(Donor donor) throws Exception {
        // Enforce server-side business rules
        if (donor.getAge() < 18 || donor.getAge() > 65) {
            throw new IllegalArgumentException("Donor age must be between 18 and 65 years.");
        }
        return firebaseService.saveDonor(donor);
    }

    public Donor updateDonor(String id, Donor donor) throws Exception {
        Donor existing = firebaseService.getDonorById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Donor with ID " + id + " does not exist.");
        }
        donor.setId(id);
        if (donor.getTimestamp() == null) {
            donor.setTimestamp(existing.getTimestamp());
        }
        return firebaseService.saveDonor(donor);
    }

    public void deleteDonor(String id) throws Exception {
        firebaseService.deleteDonor(id);
    }
}
