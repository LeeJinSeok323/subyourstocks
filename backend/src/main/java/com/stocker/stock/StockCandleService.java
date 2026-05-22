package com.stocker.stock;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class StockCandleService {

    private final JdbcTemplate clickhouse;

    public StockCandleService(@Qualifier("clickhouseJdbcTemplate") JdbcTemplate clickhouse) {
        this.clickhouse = clickhouse;
    }

    public List<Map<String, Object>> getCandles(String ticker, String interval) {
        String safe = ticker.replaceAll("[^A-Z0-9.^]", "");
        return switch (interval) {
            case "5m"   -> queryMinute(safe, 5,   500);
            case "10m"  -> queryMinute(safe, 10,  500);
            case "15m"  -> queryMinute(safe, 15,  500);
            case "60m"  -> queryMinute(safe, 60,  500);
            case "240m" -> queryMinute(safe, 240, 300);
            case "1d"   -> queryDaily(safe);
            case "1w"   -> queryWeekly(safe);
            case "1M"   -> queryMonthly(safe);
            case "1y"   -> queryYearly(safe);
            default     -> List.of();
        };
    }

    private List<Map<String, Object>> queryMinute(String ticker, int minutes, int limit) {
        String sql = String.format("""
            SELECT time, open, high, low, close, volume FROM (
                SELECT
                    toInt64(toUnixTimestamp(toStartOfInterval(datetime, INTERVAL %d MINUTE))) AS time,
                    toFloat64(argMin(open,  datetime)) AS open,
                    toFloat64(max(high))               AS high,
                    toFloat64(min(low))                AS low,
                    toFloat64(argMax(close, datetime)) AS close,
                    sum(volume)                        AS volume
                FROM stocker.ohlcv_minute
                WHERE ticker = '%s'
                GROUP BY time
                ORDER BY time DESC
                LIMIT %d
            ) ORDER BY time ASC
            """, minutes, ticker, limit);
        return clickhouse.queryForList(sql);
    }

    private List<Map<String, Object>> queryDaily(String ticker) {
        String sql = String.format("""
            SELECT time, open, high, low, close, volume FROM (
                SELECT
                    toInt64(toUnixTimestamp(date)) AS time,
                    toFloat64(open)   AS open,
                    toFloat64(high)   AS high,
                    toFloat64(low)    AS low,
                    toFloat64(close)  AS close,
                    volume
                FROM stocker.ohlcv_daily
                WHERE ticker = '%s'
                ORDER BY date DESC
                LIMIT 2000
            ) ORDER BY time ASC
            """, ticker);
        return clickhouse.queryForList(sql);
    }

    private List<Map<String, Object>> queryWeekly(String ticker) {
        String sql = String.format("""
            SELECT time, open, high, low, close, volume FROM (
                SELECT
                    toInt64(toUnixTimestamp(toMonday(date))) AS time,
                    toFloat64(argMin(open,  date)) AS open,
                    toFloat64(max(high))           AS high,
                    toFloat64(min(low))            AS low,
                    toFloat64(argMax(close, date)) AS close,
                    sum(volume)                    AS volume
                FROM stocker.ohlcv_daily
                WHERE ticker = '%s'
                GROUP BY time
                ORDER BY time DESC
                LIMIT 500
            ) ORDER BY time ASC
            """, ticker);
        return clickhouse.queryForList(sql);
    }

    private List<Map<String, Object>> queryMonthly(String ticker) {
        String sql = String.format("""
            SELECT time, open, high, low, close, volume FROM (
                SELECT
                    toInt64(toUnixTimestamp(toStartOfMonth(date))) AS time,
                    toFloat64(argMin(open,  date)) AS open,
                    toFloat64(max(high))           AS high,
                    toFloat64(min(low))            AS low,
                    toFloat64(argMax(close, date)) AS close,
                    sum(volume)                    AS volume
                FROM stocker.ohlcv_daily
                WHERE ticker = '%s'
                GROUP BY time
                ORDER BY time DESC
                LIMIT 120
            ) ORDER BY time ASC
            """, ticker);
        return clickhouse.queryForList(sql);
    }

    private List<Map<String, Object>> queryYearly(String ticker) {
        String sql = String.format("""
            SELECT time, open, high, low, close, volume FROM (
                SELECT
                    toInt64(toUnixTimestamp(toStartOfYear(date))) AS time,
                    toFloat64(argMin(open,  date)) AS open,
                    toFloat64(max(high))           AS high,
                    toFloat64(min(low))            AS low,
                    toFloat64(argMax(close, date)) AS close,
                    sum(volume)                    AS volume
                FROM stocker.ohlcv_daily
                WHERE ticker = '%s'
                GROUP BY time
                ORDER BY time DESC
                LIMIT 30
            ) ORDER BY time ASC
            """, ticker);
        return clickhouse.queryForList(sql);
    }
}
