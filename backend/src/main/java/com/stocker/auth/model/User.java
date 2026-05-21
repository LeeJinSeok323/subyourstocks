package com.stocker.auth.model;

public record User(
    Long   id,
    String username,
    String password,
    String message,    // 가입신청 메시지
    String status,     // PENDING | APPROVED | REJECTED
    String role        // USER | ADMIN
) {}
