package com.stocker.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MarketIndexService {

    private final JdbcTemplate clickhouse;

    public MarketIndexService(@Qualifier("clickhouseJdbcTemplate") JdbcTemplate clickhouse) {
        this.clickhouse = clickhouse;
    }

    /**
     * 각 symbol 당 가장 최신 수집 데이터 1건씩 반환
     */
    public List<Map<String, Object>> getLatestIndices() {
        String sql = """
            SELECT
                symbol,
                name,
                argMax(price,      fetched_at) AS price,
                argMax(prev_close, fetched_at) AS prev_close,
                argMax(change_amt, fetched_at) AS change_amt,
                argMax(change_pct, fetched_at) AS change_pct,
                max(fetched_at)                AS last_fetched_at
            FROM stocker.market_indices
            GROUP BY symbol, name
            ORDER BY symbol
            """;
        return clickhouse.queryForList(sql);
    }
}
