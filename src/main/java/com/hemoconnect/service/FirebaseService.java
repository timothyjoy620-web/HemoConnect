package com.hemoconnect.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.hemoconnect.config.FirebaseConfig;
import com.hemoconnect.model.*;
import com.hemoconnect.util.InputSanitizer;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class FirebaseService {

    // Thread-safe in-memory collections for Mock Mode
    private final Map<String, Donor> mockDonors = new ConcurrentHashMap<>();
    private final Map<String, BloodRequest> mockRequests = new ConcurrentHashMap<>();
    private final Map<String, BloodBank> mockBloodBanks = new ConcurrentHashMap<>();
    private final Map<String, Hospital> mockHospitals = new ConcurrentHashMap<>();
    private final Map<String, Admin> mockAdmins = new ConcurrentHashMap<>();
    private final List<Notification> mockNotifications = Collections.synchronizedList(new ArrayList<>());

    public FirebaseService() {
        // Automatically seed some initial demo data for local simulation (Hackathon Demo Mode - Phase 16)
        seedInitialDemoData();
    }

    private void seedInitialDemoData() {
        // 1. Seed Donors
        Donor d1 = new Donor("dn-1", "James Wilson", "james.wilson@mail.com", "+919876543210", "O-", 28, "Masculine", "Hyderabad", true, "2026-03-10", System.currentTimeMillis());
        d1.setDistrict("Gachibowli");
        d1.setDonationCount(5);
        d1.setLatitude(17.4483);
        d1.setLongitude(78.3741);

        Donor d2 = new Donor("dn-2", "Martha Stewart", "martha.stewart@mail.com", "+919876543211", "A+", 32, "Feminine", "Hyderabad", true, "", System.currentTimeMillis());
        d2.setDistrict("Secunderabad");
        d2.setDonationCount(1);
        d2.setLatitude(17.4399);
        d2.setLongitude(78.4983);

        Donor d3 = new Donor("dn-3", "Leo Garcia", "leo.garcia@mail.com", "+919876543212", "B+", 41, "Masculine", "Hyderabad", true, "2026-05-15", System.currentTimeMillis());
        d3.setDistrict("Uppal");
        d3.setDonationCount(12);
        d3.setLatitude(17.4062);
        d3.setLongitude(78.5561);

        Donor d4 = new Donor("dn-4", "Sarah Connor", "sarah.connor@mail.com", "+919876543213", "AB-", 35, "Feminine", "Bengaluru", true, "2026-05-01", System.currentTimeMillis());
        d4.setDistrict("Bengaluru");
        d4.setDonationCount(8);
        d4.setLatitude(12.9716);
        d4.setLongitude(77.5946);
        
        mockDonors.put(d1.getId(), d1);
        mockDonors.put(d2.getId(), d2);
        mockDonors.put(d3.getId(), d3);
        mockDonors.put(d4.getId(), d4);

        // Seeded Voluntary Registry Donors
        Donor f1 = new Donor("f2s-1", "Sai Kumar", "sai.kumar@volreg.org", "+919988776611", "A+", 29, "Masculine", "Hyderabad", true, "2026-03-01", System.currentTimeMillis());
        f1.setDistrict("Gachibowli");
        f1.setDonationCount(6);
        f1.setLatitude(17.4480);
        f1.setLongitude(78.3740);
        f1.setSource("VoluntaryRegistry");

        Donor f2 = new Donor("f2s-2", "Anitha Reddy", "anitha.reddy@volreg.org", "+919988776622", "O+", 34, "Feminine", "Hyderabad", true, "2026-05-10", System.currentTimeMillis());
        f2.setDistrict("Secunderabad");
        f2.setDonationCount(3);
        f2.setLatitude(17.4395);
        f2.setLongitude(78.4980);
        f2.setSource("VoluntaryRegistry");

        Donor f3 = new Donor("f2s-3", "Rahul Verma", "rahul.verma@volreg.org", "+919988776633", "B+", 41, "Masculine", "Hyderabad", true, "2026-01-15", System.currentTimeMillis());
        f3.setDistrict("Uppal");
        f3.setDonationCount(10);
        f3.setLatitude(17.4060);
        f3.setLongitude(78.5560);
        f3.setSource("VoluntaryRegistry");

        Donor f4 = new Donor("f2s-4", "Priya Sharma", "priya.sharma@volreg.org", "+919988776644", "O-", 25, "Feminine", "Hyderabad", true, "2025-11-20", System.currentTimeMillis());
        f4.setDistrict("Ghatkesar");
        f4.setDonationCount(1);
        f4.setLatitude(17.4440);
        f4.setLongitude(78.6880);
        f4.setSource("VoluntaryRegistry");

        Donor f5 = new Donor("f2s-5", "Vijay Naidu", "vijay.naidu@volreg.org", "+919988776655", "B+", 38, "Masculine", "Hyderabad", true, "2026-02-10", System.currentTimeMillis());
        f5.setDistrict("Ghatkesar");
        f5.setDonationCount(4);
        f5.setLatitude(17.4435);
        f5.setLongitude(78.6875);
        f5.setSource("VoluntaryRegistry");

        Donor f6 = new Donor("f2s-6", "Suresh Raina", "suresh.raina@volreg.org", "+919988776666", "A+", 33, "Masculine", "Hyderabad", true, "2026-02-28", System.currentTimeMillis());
        f6.setDistrict("Secunderabad");
        f6.setDonationCount(5);
        f6.setLatitude(17.4390);
        f6.setLongitude(78.4975);
        f6.setSource("VoluntaryRegistry");

        Donor f7 = new Donor("f2s-7", "Kiran Rao", "kiran.rao@volreg.org", "+919988776677", "B+", 27, "Masculine", "Hyderabad", true, "2026-03-05", System.currentTimeMillis());
        f7.setDistrict("Gachibowli");
        f7.setDonationCount(2);
        f7.setLatitude(17.4475);
        f7.setLongitude(78.3735);
        f7.setSource("VoluntaryRegistry");

        Donor f8 = new Donor("f2s-8", "Rohan Mehta", "rohan.mehta@volreg.org", "+919988776688", "O-", 30, "Masculine", "Hyderabad", true, "2026-01-05", System.currentTimeMillis());
        f8.setDistrict("Gachibowli");
        f8.setDonationCount(3);
        f8.setLatitude(17.4470);
        f8.setLongitude(78.3730);
        f8.setSource("VoluntaryRegistry");

        Donor f9 = new Donor("f2s-9", "G Srinivas", "g.srinivas@volreg.org", "+918328159193", "AB+", 35, "Masculine", "Hyderabad", true, "2026-03-10", System.currentTimeMillis());
        f9.setDistrict("Gachibowli");
        f9.setDonationCount(8);
        f9.setLatitude(17.4481);
        f9.setLongitude(78.3742);
        f9.setSource("VoluntaryRegistry");

        Donor f10 = new Donor("f2s-10", "Sathwik reddy", "sathwik.r@volreg.org", "+919491500331", "AB+", 28, "Masculine", "Hyderabad", true, "2026-03-15", System.currentTimeMillis());
        f10.setDistrict("Secunderabad");
        f10.setDonationCount(4);
        f10.setLatitude(17.4392);
        f10.setLongitude(78.4981);
        f10.setSource("VoluntaryRegistry");

        Donor f11 = new Donor("f2s-11", "Vishnu Sudoor", "vishnu.s@volreg.org", "+919052111180", "AB+", 32, "Masculine", "Hyderabad", true, "2026-03-20", System.currentTimeMillis());
        f11.setDistrict("Uppal");
        f11.setDonationCount(9);
        f11.setLatitude(17.4061);
        f11.setLongitude(78.5562);
        f11.setSource("VoluntaryRegistry");

        Donor f12 = new Donor("f2s-12", "Md Farhan", "md.farhan@volreg.org", "+918789151173", "AB+", 26, "Masculine", "Hyderabad", true, "2026-03-01", System.currentTimeMillis());
        f12.setDistrict("Ghatkesar");
        f12.setDonationCount(2);
        f12.setLatitude(17.4439);
        f12.setLongitude(78.6879);
        f12.setSource("VoluntaryRegistry");

        Donor f13 = new Donor("f2s-13", "Narendra Babu Jallepally", "narendra.j@volreg.org", "+918056194427", "AB+", 44, "Masculine", "Hyderabad", true, "2026-02-15", System.currentTimeMillis());
        f13.setDistrict("Gachibowli");
        f13.setDonationCount(15);
        f13.setLatitude(17.4485);
        f13.setLongitude(78.3745);
        f13.setSource("VoluntaryRegistry");

        Donor f14 = new Donor("f2s-14", "Syed Harun Mehdi", "syed.harun@volreg.org", "+919700430490", "AB+", 31, "Masculine", "Hyderabad", true, "2026-02-20", System.currentTimeMillis());
        f14.setDistrict("Secunderabad");
        f14.setDonationCount(6);
        f14.setLatitude(17.4397);
        f14.setLongitude(78.4984);
        f14.setSource("VoluntaryRegistry");

        mockDonors.put(f1.getId(), f1);
        mockDonors.put(f2.getId(), f2);
        mockDonors.put(f3.getId(), f3);
        mockDonors.put(f4.getId(), f4);
        mockDonors.put(f5.getId(), f5);
        mockDonors.put(f6.getId(), f6);
        mockDonors.put(f7.getId(), f7);
        mockDonors.put(f8.getId(), f8);
        mockDonors.put(f9.getId(), f9);
        mockDonors.put(f10.getId(), f10);
        mockDonors.put(f11.getId(), f11);
        mockDonors.put(f12.getId(), f12);
        mockDonors.put(f13.getId(), f13);
        mockDonors.put(f14.getId(), f14);

        // 2. Seed Blood Requests
        BloodRequest r1 = new BloodRequest("req-1", "James Wilson", "O-", 4, "St. Jude Medical Center", "CRITICAL", "+919119110001", "Hyderabad", "PENDING", System.currentTimeMillis());
        BloodRequest r2 = new BloodRequest("req-2", "Martha Stewart", "A+", 2, "City Medical Hub", "URGENT", "+919119110002", "Hyderabad", "PENDING", System.currentTimeMillis());
        BloodRequest r3 = new BloodRequest("req-3", "Leo Garcia", "B+", 3, "Children's Care Unit", "ROUTINE", "+919119110003", "Hyderabad", "COMPLETED", System.currentTimeMillis() - 100000);
        
        mockRequests.put(r1.getId(), r1);
        mockRequests.put(r2.getId(), r2);
        mockRequests.put(r3.getId(), r3);

        // 3. Seed Blood Banks from JSON dataset (Hyderabad 132 Blood Banks)
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.io.InputStream is = getClass().getResourceAsStream("/blood_banks_data.json");
            if (is != null) {
                List<BloodBank> banks = mapper.readValue(is, new com.fasterxml.jackson.core.type.TypeReference<List<BloodBank>>(){});
                for (BloodBank bank : banks) {
                    if (bank.getTimestamp() == null) {
                        bank.setTimestamp(System.currentTimeMillis());
                    }
                    mockBloodBanks.put(bank.getId(), bank);
                }
                System.out.println("[FirebaseService] Seeded " + mockBloodBanks.size() + " blood banks from JSON database.");
            } else {
                System.err.println("[FirebaseService] Warning: blood_banks_data.json not found in classpath!");
            }
        } catch (Exception e) {
            System.err.println("[FirebaseService] Failed to seed blood banks from JSON: " + e.getMessage());
            e.printStackTrace();
        }

        // 4. Seed Hospitals
        Hospital h1 = new Hospital("hosp-1", "St. Jude Medical Center", "Gachibowli, Hyderabad", "+9199001122", "admin@stjude.org", "hak-stjude-789", System.currentTimeMillis());
        h1.setAddress("Phase 2, Gachibowli, Hyderabad");
        h1.setCity("Hyderabad");
        h1.setDistrict("Gachibowli");
        h1.setContactNumber("+9199001122");

        Hospital h2 = new Hospital("hosp-2", "City Medical Hub", "Secunderabad, Hyderabad", "+9199003344", "contact@citymed.org", "hak-citymed-101", System.currentTimeMillis());
        h2.setAddress("Secunderabad Road, Hyderabad");
        h2.setCity("Hyderabad");
        h2.setDistrict("Secunderabad");
        h2.setContactNumber("+9199003344");
        
        mockHospitals.put(h1.getId(), h1);
        mockHospitals.put(h2.getId(), h2);

        int hospCounter = 3;
        for (BloodBank bank : mockBloodBanks.values()) {
            String nameLower = bank.getName().toLowerCase();
            if (nameLower.contains("hospital") || nameLower.contains("medical") || nameLower.contains("chc") || 
                nameLower.contains("centre") || nameLower.contains("center") || nameLower.contains("health") || 
                nameLower.contains("institute")) {
                
                String hospId = "hosp-" + hospCounter++;
                Hospital h = new Hospital(
                    hospId,
                    bank.getName(),
                    bank.getAddress(),
                    bank.getContactNumber() != null ? bank.getContactNumber() : "+9199001122",
                    bank.getEmail() != null ? bank.getEmail() : "admin@" + bank.getName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + ".org",
                    "hak-" + bank.getId(),
                    System.currentTimeMillis()
                );
                h.setAddress(bank.getAddress());
                h.setCity(bank.getCity());
                h.setDistrict(bank.getSubLocation() != null ? bank.getSubLocation() : bank.getDistrict());
                h.setContactNumber(bank.getContactNumber());
                mockHospitals.put(h.getId(), h);
            }
        }

        // 5. Seed Admin
        Admin a1 = new Admin("admin-1", "admin@hemoconnect.org", "Dr. Sarah Chen", "ADMIN", System.currentTimeMillis());
        mockAdmins.put(a1.getId(), a1);

        // 6. Seed Notifications
        mockNotifications.add(new Notification("notif-1", "Emergency O- blood request initiated by St. Jude Medical Center", "ALERT", "ALL", System.currentTimeMillis()));
        mockNotifications.add(new Notification("notif-2", "AB- Negative supply critically low in Secunderabad Blood Repository", "ALERT", "ALL", System.currentTimeMillis() - 50000));
    }

    private Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }

    // ==========================================
    // DONORS CRUD
    // ==========================================
    public List<Donor> getAllDonors() throws Exception {
        if (FirebaseConfig.isMockMode()) {
            return new ArrayList<>(mockDonors.values());
        }
        List<Donor> list = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = getFirestore().collection("donors").get();
        List<QueryDocumentSnapshot> documents = future.get(10, TimeUnit.SECONDS).getDocuments();
        for (QueryDocumentSnapshot doc : documents) {
            Donor item = doc.toObject(Donor.class);
            item.setId(doc.getId());
            list.add(item);
        }
        return list;
    }

    public Donor getDonorById(String id) throws Exception {
        if (FirebaseConfig.isMockMode()) {
            return mockDonors.get(id);
        }
        DocumentSnapshot doc = getFirestore().collection("donors").document(id).get().get(10, TimeUnit.SECONDS);
        if (doc.exists()) {
            Donor item = doc.toObject(Donor.class);
            item.setId(doc.getId());
            return item;
        }
        return null;
    }

    public Donor saveDonor(Donor donor) throws Exception {
        if (donor.getId() == null || donor.getId().isEmpty()) {
            donor.setId("dn-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (donor.getTimestamp() == null) {
            donor.setTimestamp(System.currentTimeMillis());
        }
        
        // Strict input sanitization (OWASP best practice)
        donor.setFullName(InputSanitizer.sanitize(donor.getFullName()));
        donor.setEmail(InputSanitizer.sanitize(donor.getEmail()));
        donor.setPhone(InputSanitizer.sanitize(donor.getPhone()));
        donor.setBloodGroup(InputSanitizer.sanitize(donor.getBloodGroup()));
        donor.setGender(InputSanitizer.sanitize(donor.getGender()));
        donor.setCity(InputSanitizer.sanitize(donor.getCity()));
        donor.setDistrict(InputSanitizer.sanitize(donor.getDistrict()));
        donor.setLastDonationDate(InputSanitizer.sanitize(donor.getLastDonationDate()));

        if (FirebaseConfig.isMockMode()) {
            mockDonors.put(donor.getId(), donor);
            return donor;
        }
        getFirestore().collection("donors").document(donor.getId()).set(donor).get(10, TimeUnit.SECONDS);
        return donor;
    }

    public void deleteDonor(String id) throws Exception {
        if (FirebaseConfig.isMockMode()) {
            mockDonors.remove(id);
            return;
        }
        getFirestore().collection("donors").document(id).delete().get(10, TimeUnit.SECONDS);
    }

    // ==========================================
    // BLOOD REQUESTS CRUD
    // ==========================================
    public List<BloodRequest> getAllRequests() throws Exception {
        if (FirebaseConfig.isMockMode()) {
            return new ArrayList<>(mockRequests.values());
        }
        List<BloodRequest> list = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = getFirestore().collection("blood_requests").get();
        List<QueryDocumentSnapshot> documents = future.get(10, TimeUnit.SECONDS).getDocuments();
        for (QueryDocumentSnapshot doc : documents) {
            BloodRequest item = doc.toObject(BloodRequest.class);
            item.setId(doc.getId());
            list.add(item);
        }
        return list;
    }

    public BloodRequest getRequestById(String id) throws Exception {
        if (FirebaseConfig.isMockMode()) {
            return mockRequests.get(id);
        }
        DocumentSnapshot doc = getFirestore().collection("blood_requests").document(id).get().get(10, TimeUnit.SECONDS);
        if (doc.exists()) {
            BloodRequest item = doc.toObject(BloodRequest.class);
            item.setId(doc.getId());
            return item;
        }
        return null;
    }

    public BloodRequest saveRequest(BloodRequest request) throws Exception {
        if (request.getId() == null || request.getId().isEmpty()) {
            request.setId("req-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (request.getTimestamp() == null) {
            request.setTimestamp(System.currentTimeMillis());
        }
        
        // Strict input sanitization (OWASP best practice)
        request.setPatientName(InputSanitizer.sanitize(request.getPatientName()));
        request.setBloodGroupRequired(InputSanitizer.sanitize(request.getBloodGroupRequired()));
        request.setHospital(InputSanitizer.sanitize(request.getHospital()));
        request.setEmergencyLevel(InputSanitizer.sanitize(request.getEmergencyLevel()));
        request.setContactNumber(InputSanitizer.sanitize(request.getContactNumber()));
        request.setCity(InputSanitizer.sanitize(request.getCity()));
        request.setStatus(InputSanitizer.sanitize(request.getStatus()));

        if (FirebaseConfig.isMockMode()) {
            mockRequests.put(request.getId(), request);
            return request;
        }
        getFirestore().collection("blood_requests").document(request.getId()).set(request).get(10, TimeUnit.SECONDS);
        return request;
    }

    public void deleteRequest(String id) throws Exception {
        if (FirebaseConfig.isMockMode()) {
            mockRequests.remove(id);
            return;
        }
        getFirestore().collection("blood_requests").document(id).delete().get(10, TimeUnit.SECONDS);
    }

    // ==========================================
    // BLOOD BANKS CRUD
    // ==========================================
    public List<BloodBank> getAllBloodBanks() throws Exception {
        if (FirebaseConfig.isMockMode()) {
            for (BloodBank bank : mockBloodBanks.values()) {
                Map<String, Integer> inv = bank.getBloodInventory();
                if (inv != null) {
                    for (Map.Entry<String, Integer> entry : inv.entrySet()) {
                        int current = entry.getValue() != null ? entry.getValue() : 0;
                        int delta = (int)(Math.random() * 3) - 1; // -1, 0, or 1
                        int nextVal = Math.max(0, Math.min(50, current + delta));
                        entry.setValue(nextVal);
                    }
                }
            }
            return new ArrayList<>(mockBloodBanks.values());
        }
        List<BloodBank> list = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = getFirestore().collection("blood_banks").get();
        List<QueryDocumentSnapshot> documents = future.get(10, TimeUnit.SECONDS).getDocuments();
        for (QueryDocumentSnapshot doc : documents) {
            BloodBank item = doc.toObject(BloodBank.class);
            item.setId(doc.getId());
            list.add(item);
        }
        return list;
    }

    public BloodBank saveBloodBank(BloodBank bank) throws Exception {
        if (bank.getId() == null || bank.getId().isEmpty()) {
            bank.setId("bb-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (bank.getTimestamp() == null) {
            bank.setTimestamp(System.currentTimeMillis());
        }
        
        // Strict input sanitization (OWASP best practice)
        bank.setName(InputSanitizer.sanitize(bank.getName()));
        bank.setType(InputSanitizer.sanitize(bank.getType()));
        bank.setAddress(InputSanitizer.sanitize(bank.getAddress()));
        bank.setCity(InputSanitizer.sanitize(bank.getCity()));
        bank.setSubLocation(InputSanitizer.sanitize(bank.getSubLocation()));
        bank.setDistrict(InputSanitizer.sanitize(bank.getDistrict()));
        bank.setContactNumber(InputSanitizer.sanitize(bank.getContactNumber()));
        bank.setEmail(InputSanitizer.sanitize(bank.getEmail()));
        bank.setState(InputSanitizer.sanitize(bank.getState()));
        bank.setBak(InputSanitizer.sanitize(bank.getBak()));

        if (FirebaseConfig.isMockMode()) {
            mockBloodBanks.put(bank.getId(), bank);
            return bank;
        }
        getFirestore().collection("blood_banks").document(bank.getId()).set(bank).get(10, TimeUnit.SECONDS);
        return bank;
    }

    public void deleteBloodBank(String id) throws Exception {
        if (FirebaseConfig.isMockMode()) {
            mockBloodBanks.remove(id);
            return;
        }
        getFirestore().collection("blood_banks").document(id).delete().get(10, TimeUnit.SECONDS);
    }

    // ==========================================
    // HOSPITALS CRUD
    // ==========================================
    public List<Hospital> getAllHospitals() throws Exception {
        if (FirebaseConfig.isMockMode()) {
            return new ArrayList<>(mockHospitals.values());
        }
        List<Hospital> list = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = getFirestore().collection("hospitals").get();
        List<QueryDocumentSnapshot> documents = future.get(10, TimeUnit.SECONDS).getDocuments();
        for (QueryDocumentSnapshot doc : documents) {
            Hospital item = doc.toObject(Hospital.class);
            item.setId(doc.getId());
            list.add(item);
        }
        return list;
    }

    public Hospital saveHospital(Hospital hospital) throws Exception {
        if (hospital.getId() == null || hospital.getId().isEmpty()) {
            hospital.setId("hosp-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (hospital.getTimestamp() == null) {
            hospital.setTimestamp(System.currentTimeMillis());
        }
        
        // Strict input sanitization (OWASP best practice)
        hospital.setHospitalName(InputSanitizer.sanitize(hospital.getHospitalName()));
        hospital.setLocation(InputSanitizer.sanitize(hospital.getLocation()));
        hospital.setEmergencyContact(InputSanitizer.sanitize(hospital.getEmergencyContact()));
        hospital.setAddress(InputSanitizer.sanitize(hospital.getAddress()));
        hospital.setCity(InputSanitizer.sanitize(hospital.getCity()));
        hospital.setDistrict(InputSanitizer.sanitize(hospital.getDistrict()));
        hospital.setContactNumber(InputSanitizer.sanitize(hospital.getContactNumber()));
        hospital.setCorporateEmail(InputSanitizer.sanitize(hospital.getCorporateEmail()));
        hospital.setHak(InputSanitizer.sanitize(hospital.getHak()));

        if (FirebaseConfig.isMockMode()) {
            mockHospitals.put(hospital.getId(), hospital);
            return hospital;
        }
        getFirestore().collection("hospitals").document(hospital.getId()).set(hospital).get(10, TimeUnit.SECONDS);
        return hospital;
    }

    public void deleteHospital(String id) throws Exception {
        if (FirebaseConfig.isMockMode()) {
            mockHospitals.remove(id);
            return;
        }
        getFirestore().collection("hospitals").document(id).delete().get(10, TimeUnit.SECONDS);
    }

    // ==========================================
    // ADMINS CRUD
    // ==========================================
    public List<Admin> getAllAdmins() throws Exception {
        if (FirebaseConfig.isMockMode()) {
            return new ArrayList<>(mockAdmins.values());
        }
        List<Admin> list = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = getFirestore().collection("admins").get();
        List<QueryDocumentSnapshot> documents = future.get(10, TimeUnit.SECONDS).getDocuments();
        for (QueryDocumentSnapshot doc : documents) {
            Admin item = doc.toObject(Admin.class);
            item.setId(doc.getId());
            list.add(item);
        }
        return list;
    }

    // ==========================================
    // NOTIFICATIONS CRUD
    // ==========================================
    public List<Notification> getAllNotifications() throws Exception {
        if (FirebaseConfig.isMockMode()) {
            return new ArrayList<>(mockNotifications);
        }
        List<Notification> list = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = getFirestore().collection("notifications").get();
        List<QueryDocumentSnapshot> documents = future.get(10, TimeUnit.SECONDS).getDocuments();
        for (QueryDocumentSnapshot doc : documents) {
            Notification item = doc.toObject(Notification.class);
            item.setId(doc.getId());
            list.add(item);
        }
        return list;
    }

    public Notification saveNotification(Notification notification) throws Exception {
        if (notification.getId() == null || notification.getId().isEmpty()) {
            notification.setId("notif-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (notification.getTimestamp() == null) {
            notification.setTimestamp(System.currentTimeMillis());
        }
        
        // Strict input sanitization (OWASP best practice)
        notification.setMessage(InputSanitizer.sanitize(notification.getMessage()));
        notification.setType(InputSanitizer.sanitize(notification.getType()));
        notification.setRecipient(InputSanitizer.sanitize(notification.getRecipient()));

        if (FirebaseConfig.isMockMode()) {
            mockNotifications.add(0, notification); // Add to front of list
            return notification;
        }
        getFirestore().collection("notifications").document(notification.getId()).set(notification).get(10, TimeUnit.SECONDS);
        return notification;
    }

    // Hackathon Seeder Trigger (Phase 16)
    public void resetAndSeedDemoData() {
        mockDonors.clear();
        mockRequests.clear();
        mockBloodBanks.clear();
        mockHospitals.clear();
        mockAdmins.clear();
        mockNotifications.clear();
        seedInitialDemoData();

        // If in live Firebase mode, write all mock seeded values to Firestore!
        if (!com.hemoconnect.config.FirebaseConfig.isMockMode()) {
            System.out.println("[FirebaseService] Live Mode: Importing seeded dataset into Firestore collections...");
            try {
                // Write donors
                for (Donor d : mockDonors.values()) {
                    saveDonor(d);
                }
                // Write blood banks
                for (BloodBank b : mockBloodBanks.values()) {
                    saveBloodBank(b);
                }
                // Write requests
                for (BloodRequest r : mockRequests.values()) {
                    saveRequest(r);
                }
                // Write hospitals
                for (Hospital h : mockHospitals.values()) {
                    saveHospital(h);
                }
                // Write notifications
                for (Notification n : mockNotifications) {
                    saveNotification(n);
                }
                System.out.println("[FirebaseService] Firestore import complete!");
            } catch (Exception e) {
                System.err.println("[FirebaseService] Failed to import to Firestore: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}
