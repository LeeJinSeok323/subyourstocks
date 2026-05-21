package com.stocker.auth.dto;

public record AdminUserDto(
    Long   id,
    String username,
    String message,
    String status,
    String createdAt
) {}
