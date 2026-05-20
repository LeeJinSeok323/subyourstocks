package com.stocker.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ScreeningService {

    private final JdbcTemplate clickhouse;

    public ScreeningService(@Qualifier("clickhouseJdbcTemplate") JdbcTemplate clickhouse) {
        this.clickhouse = clickhouse;
    }

    public List<Map<String, Object>> screenByPriceChange(int days, double minChangePercent, int limit) {
        String sql = String.format("""
            SELECT
                ticker,
                min(close) AS low_price,
                max(close) AS high_price,
                round((max(close) - min(close)) / min(close) * 100, 2) AS change_percent,
                max(date) AS last_date
            FROM stocker.ohlcv_daily
            WHERE date >= subtractDays(today(), %d)
            GROUP BY ticker
            HAVING change_percent >= %s
            ORDER BY change_percent DESC
            LIMIT %d
            """, days, minChangePercent, limit);
        return clickhouse.queryForList(sql);
    }

    public List<Map<String, Object>> screenByVolumeSpike(int days, double minVolumeRatio, int limit) {
        String sql = String.format("""
            SELECT
                ticker,
                avg(volume) AS avg_volume,
                max(volume) AS max_volume,
                round(max(volume) / avg(volume), 2) AS volume_ratio,
                max(date) AS last_date
            FROM stocker.ohlcv_daily
            WHERE date >= subtractDays(today(), %d)
            GROUP BY ticker
            HAVING volume_ratio >= %s
            ORDER BY volume_ratio DESC
            LIMIT %d
            """, days, minVolumeRatio, limit);
        return clickhouse.queryForList(sql);
    }

    public List<Map<String, Object>> getStockHistory(String ticker, int days) {
        String sql = String.format("""
            SELECT date, open, high, low, close, volume
            FROM stocker.ohlcv_daily
            WHERE ticker = '%s' AND date >= subtractDays(today(), %d)
            ORDER BY date ASC
            """, ticker.replaceAll("[^A-Z0-9.]", ""), days);
        return clickhouse.queryForList(sql);
    }
}
