package com.stocker.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ScreeningService {

    @Qualifier("clickhouseJdbcTemplate")
    private final JdbcTemplate clickhouse;

    public List<Map<String, Object>> screenByPriceChange(int days, double minChangePercent, int limit) {
        String sql = """
            SELECT
                ticker,
                min(close) AS low_price,
                max(close) AS high_price,
                round((max(close) - min(close)) / min(close) * 100, 2) AS change_percent,
                max(date) AS last_date
            FROM stocker.stock_daily_price
            WHERE date >= today() - ?
            GROUP BY ticker
            HAVING change_percent >= ?
            ORDER BY change_percent DESC
            LIMIT ?
            """;
        return clickhouse.queryForList(sql, days, minChangePercent, limit);
    }

    public List<Map<String, Object>> screenByVolumeSpike(int days, double minVolumeRatio, int limit) {
        String sql = """
            SELECT
                ticker,
                avg(volume) AS avg_volume,
                max(volume) AS max_volume,
                round(max(volume) / avg(volume), 2) AS volume_ratio,
                max(date) AS last_date
            FROM stocker.stock_daily_price
            WHERE date >= today() - ?
            GROUP BY ticker
            HAVING volume_ratio >= ?
            ORDER BY volume_ratio DESC
            LIMIT ?
            """;
        return clickhouse.queryForList(sql, days, minVolumeRatio, limit);
    }

    public List<Map<String, Object>> getStockHistory(String ticker, int days) {
        String sql = """
            SELECT date, open, high, low, close, volume
            FROM stocker.stock_daily_price
            WHERE ticker = ? AND date >= today() - ?
            ORDER BY date ASC
            """;
        return clickhouse.queryForList(sql, ticker, days);
    }
}
