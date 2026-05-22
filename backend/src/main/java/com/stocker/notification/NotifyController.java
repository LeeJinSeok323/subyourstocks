package com.stocker.notification;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notify")
public class NotifyController {

    private final AlertNotificationService notificationService;

    public NotifyController(AlertNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * POST /api/notify/sec
     * 수집봇이 SEC 공시 감지 시 호출
     *
     * Body: { "ticker": "NVDA", "secType": "8-K", "title": "Current Report" }
     */
    @PostMapping("/sec")
    public Object notifySec(@RequestBody Map<String, String> body) {
        String ticker  = body.get("ticker");
        String secType = body.get("secType");
        String title   = body.getOrDefault("title", "");

        if (ticker == null || secType == null) {
            return Map.of("ok", false, "error", "ticker, secType 필수");
        }

        try {
            notificationService.notifySecFiling(ticker, secType, title);
            return Map.of("ok", true);
        } catch (Exception e) {
            return Map.of("ok", false, "error", e.getMessage());
        }
    }
}
