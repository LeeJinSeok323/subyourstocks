package com.stocker.auth;

import com.stocker.auth.dto.LoginRequest;
import com.stocker.auth.dto.LoginResponse;
import com.stocker.auth.dto.RegisterRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * 로그인
     * 1) 아이디 존재 확인
     * 2) status 확인 (PENDING → 대기, REJECTED → 거절)
     * 3) BCrypt 비밀번호 검증 (단방향 해시 → matches() 로 검증)
     * 4) JWT 발급 (role 포함)
     */
    public LoginResponse login(LoginRequest req) {
        var user = userRepository.findByUsername(req.username())
            .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        switch (user.status()) {
            case "PENDING"  -> throw new IllegalArgumentException("가입신청 승인 대기 중입니다. 관리자의 승인을 기다려주세요.");
            case "REJECTED" -> throw new IllegalArgumentException("가입이 거절되었습니다. 관리자에게 문의하세요.");
        }

        if (!passwordEncoder.matches(req.password(), user.password())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        // 자동 로그인: 30일 / 일반: 24시간
        long expiry = req.autoLogin()
            ? 30L * 24 * 60 * 60 * 1000
            :       24 * 60 * 60 * 1000;
        String token = jwtService.generateToken(user.username(), user.role(), expiry);
        return new LoginResponse(token, user.username(), user.role());
    }

    /**
     * 가입신청
     * 1) 중복 아이디 확인
     * 2) BCrypt 해싱 후 DB 저장 (status=PENDING, role=USER)
     * → 즉시 로그인 안 됨. 관리자 승인 필요.
     */
    public void register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        String encodedPassword = passwordEncoder.encode(req.password());
        userRepository.save(req.username(), encodedPassword, req.message());
    }
}
