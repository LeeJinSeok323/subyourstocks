package com.stocker.stock;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stocks")
public class StockSearchController {

    private final JdbcTemplate jdbc;

    public StockSearchController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * GET /api/stocks/search?q=NVD
     * ticker 또는 company_name에서 앞글자 일치 검색, 최대 10건
     */
    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam String q) {
        if (q == null || q.isBlank() || q.length() < 1) return List.of();

        String keyword = q.trim().toUpperCase().replaceAll("[^A-Z0-9가-힣\\s]", "") + "%";
        String sql = """
            SELECT ticker, company_name, exchange
            FROM stocks
            WHERE (UPPER(ticker) LIKE ? OR UPPER(company_name) LIKE ?)
              AND delisted_at IS NULL
            ORDER BY
              CASE WHEN UPPER(ticker) LIKE ? THEN 0 ELSE 1 END,
              ticker
            LIMIT 10
            """;
        return jdbc.queryForList(sql, keyword, keyword, keyword);
    }
}
