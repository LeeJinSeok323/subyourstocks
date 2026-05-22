package com.stocker.alert.dto;

import java.util.List;

/**
 * 알림 저장 요청
 * types: 활성화할 alert_type 목록 (예: ["8-K", "10-K"])
 */
public record AlertRequest(List<String> types) {}
