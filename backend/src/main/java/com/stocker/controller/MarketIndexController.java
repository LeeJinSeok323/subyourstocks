package com.stocker.controller;

import com.stocker.service.MarketIndexService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MarketIndexController {

    private final MarketIndexService marketIndexService;

    /**
     * GET /api/market/indices
     * 대시보드용 지수 데이터 (symbol당 최신 1건)
     */
    @GetMapping("/indices")
    public Object getIndices() {
        try {
            return marketIndexService.getLatestIndices();
        } catch (Exception e) {
            return Map.of(
                "error", e.getMessage(),
                "cause", e.getCause() != null ? e.getCause().getMessage() : ""
            );
        }
    }
}
