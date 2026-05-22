package com.stocker.alert;

import com.stocker.alert.dto.AlertRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    /** 현재 알림 설정 조회 */
    @GetMapping("/{ticker}")
    public Object getAlert(@PathVariable String ticker, Authentication auth) {
        return alertService.getAlert(auth.getName(), ticker)
            .map(data -> Map.of("active", true, "options", data))
            .orElse(Map.of("active", false));
    }

    /** 알림 저장 (ON + 옵션) */
    @PostMapping("/{ticker}")
    public Object saveAlert(@PathVariable String ticker,
                            @RequestBody AlertRequest req,
                            Authentication auth) {
        try {
            alertService.saveAlert(auth.getName(), ticker, req);
            return Map.of("ok", true);
        } catch (Exception e) {
            return Map.of("ok", false, "error", e.getMessage());
        }
    }

    /** 알림 끄기 */
    @DeleteMapping("/{ticker}")
    public Object deleteAlert(@PathVariable String ticker, Authentication auth) {
        try {
            alertService.deleteAlert(auth.getName(), ticker);
            return Map.of("ok", true);
        } catch (Exception e) {
            return Map.of("ok", false, "error", e.getMessage());
        }
    }
}
