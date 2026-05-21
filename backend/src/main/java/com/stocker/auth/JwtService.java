package com.stocker.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expiration;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration}") long expiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    /** 로그인 성공 시 JWT 발급 (role 클레임 포함) */
    public String generateToken(String username, String role) {
        return generateToken(username, role, expiration);
    }

    /** 자동 로그인용 — 만료 시간 직접 지정 */
    public String generateToken(String username, String role, long customExpiration) {
        return Jwts.builder()
            .subject(username)
            .claim("role", role)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + customExpiration))
            .signWith(key)
            .compact();
    }

    /** 토큰에서 username 추출 */
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /** 토큰에서 role 추출 */
    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /** 토큰 유효성 검증 (서명 + 만료 시간) */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
