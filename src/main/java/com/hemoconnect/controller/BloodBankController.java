package com.hemoconnect.controller;

import com.hemoconnect.model.BloodBank;
import com.hemoconnect.service.FirebaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/bloodbanks")
public class BloodBankController {

    @Autowired
    private FirebaseService firebaseService;

    @GetMapping
    public ResponseEntity<List<BloodBank>> getAllBloodBanks() throws Exception {
        return ResponseEntity.ok(firebaseService.getAllBloodBanks());
    }

    @PostMapping
    public ResponseEntity<BloodBank> registerBloodBank(@Valid @RequestBody BloodBank bank) throws Exception {
        // Automatically assign a Blood Bank Access Key (BAK) if not provided
        if (bank.getBak() == null || bank.getBak().isEmpty()) {
            bank.setBak("bak-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        }
        BloodBank saved = firebaseService.saveBloodBank(bank);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BloodBank> updateBloodBank(@PathVariable String id, @Valid @RequestBody BloodBank bank) throws Exception {
        // Enforce entity keys
        bank.setId(id);
        BloodBank saved = firebaseService.saveBloodBank(bank);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBloodBank(@PathVariable String id) throws Exception {
        firebaseService.deleteBloodBank(id);
        return ResponseEntity.noContent().build();
    }
}
