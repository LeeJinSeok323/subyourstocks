package com.stocker.auth;

import com.stocker.auth.dto.AdminUserDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")   // ADMIN role 없으면 403
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** GET /api/admin/applications — 전체 가입신청 목록 */
    @GetMapping("/applications")
    public List<AdminUserDto> getApplications() {
        return userRepository.findAllApplications();
    }

    /** POST /api/admin/approve/{id} — 승인 */
    @PostMapping("/approve/{id}")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        userRepository.updateStatus(id, "APPROVED");
        return ResponseEntity.ok(Map.of("message", "승인되었습니다."));
    }

    /** POST /api/admin/reject/{id} — 거절 */
    @PostMapping("/reject/{id}")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        userRepository.updateStatus(id, "REJECTED");
        return ResponseEntity.ok(Map.of("message", "거절되었습니다."));
    }
}
