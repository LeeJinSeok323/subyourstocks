package com.stocker.auth.dto;

public record LoginRequest(String username, String password, boolean autoLogin) {}
