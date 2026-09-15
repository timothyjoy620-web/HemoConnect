package com.hemoconnect.controller;

import com.hemoconnect.model.Donor;
import com.hemoconnect.service.DonorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    @Autowired
    private DonorService donorService;

    @Autowired
    private com.hemoconnect.service.VoluntaryRegistryScraper voluntaryRegistryScraper;

    @GetMapping("/search-external")
    public ResponseEntity<List<Donor>> searchExternalDonors(
            @RequestParam String bloodGroup,
            @RequestParam(required = false) String city) throws Exception {
        return ResponseEntity.ok(voluntaryRegistryScraper.scrapeDonors(bloodGroup, city));
    }

    @GetMapping
    public ResponseEntity<List<Donor>> getAllDonors() throws Exception {
        return ResponseEntity.ok(donorService.getAllDonors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Donor> getDonorById(@PathVariable String id) throws Exception {
        Donor donor = donorService.getDonorById(id);
        if (donor == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(donor);
    }

    @PostMapping
    public ResponseEntity<Donor> registerDonor(@Valid @RequestBody Donor donor) throws Exception {
        Donor saved = donorService.registerDonor(donor);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Donor> updateDonor(@PathVariable String id, @Valid @RequestBody Donor donor) throws Exception {
        try {
            Donor updated = donorService.updateDonor(id, donor);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDonor(@PathVariable String id) throws Exception {
        donorService.deleteDonor(id);
        return ResponseEntity.noContent().build();
    }
}
