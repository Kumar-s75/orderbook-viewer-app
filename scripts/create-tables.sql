-- Create tables for storing orderbook data and simulated orders
-- This would be used if we wanted to persist data

CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    api_endpoint VARCHAR(255),
    websocket_endpoint VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS symbols (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    base_currency VARCHAR(10),
    quote_currency VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orderbook_snapshots (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER REFERENCES venues(id),
    symbol_id INTEGER REFERENCES symbols(id),
    bids JSONB,
    asks JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (venue_id, symbol_id, timestamp)
);

CREATE TABLE IF NOT EXISTS simulated_orders (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER REFERENCES venues(id),
    symbol_id INTEGER REFERENCES symbols(id),
    order_type VARCHAR(10),
    side VARCHAR(4),
    price DECIMAL(20, 8),
    quantity DECIMAL(20, 8),
    timing VARCHAR(20),
    fill_percentage DECIMAL(5, 2),
    market_impact DECIMAL(8, 4),
    slippage DECIMAL(10, 2),
    estimated_fill_time VARCHAR(20),
    warnings TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial venue data
INSERT INTO venues (name, websocket_endpoint) VALUES
    ('OKX', 'wss://ws.okx.com:8443/ws/v5/public'),
    ('Bybit', 'wss://stream.bybit.com/v5/public/spot'),
    ('Deribit', 'wss://www.deribit.com/ws/api/v2')
ON CONFLICT (name) DO NOTHING;

-- Insert initial symbol data
INSERT INTO symbols (symbol, base_currency, quote_currency) VALUES
    ('BTC-USD', 'BTC', 'USD'),
    ('ETH-USD', 'ETH', 'USD'),
    ('BTC-USDT', 'BTC', 'USDT'),
    ('ETH-USDT', 'ETH', 'USDT')
ON CONFLICT (symbol) DO NOTHING;
