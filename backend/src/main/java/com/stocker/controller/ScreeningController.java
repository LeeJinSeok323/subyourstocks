package com.stocker.controller;

import com.stocker.service.ScreeningService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/screening")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScreeningController {

    private final ScreeningService screeningService;

    @GetMapping("/price")
    public List<Map<String, Object>> screenByPrice(
            @RequestParam(defaultValue = "20") int days,
            @RequestParam(defaultValue = "10.0") double minChangePercent,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return screeningService.screenByPriceChange(days, minChangePercent, limit);
    }

    @GetMapping("/volume")
    public List<Map<String, Object>> screenByVolume(
            @RequestParam(defaultValue = "5") int days,
            @RequestParam(defaultValue = "3.0") double minVolumeRatio,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return screeningService.screenByVolumeSpike(days, minVolumeRatio, limit);
    }

    @GetMapping("/stock/{ticker}")
    public List<Map<String, Object>> getStockHistory(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "90") int days
    ) {
        return screeningService.getStockHistory(ticker.toUpperCase(), days);
    }
}
