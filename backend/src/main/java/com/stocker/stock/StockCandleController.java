package com.stocker.stock;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stocks")
public class StockCandleController {

    private final StockCandleService candleService;

    public StockCandleController(StockCandleService candleService) {
        this.candleService = candleService;
    }

    /**
     * GET /api/stocks/{ticker}/candles?interval=1m|5m|15m|60m|240m|1d|1w|1M|1y
     */
    @GetMapping("/{ticker}/candles")
    public Object getCandles(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "1d") String interval
    ) {
        try {
            return candleService.getCandles(ticker.toUpperCase(), interval);
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }
}
