# Real-Time Orderbook Viewer with Order Simulation

A Next.js application that displays real-time orderbook data from multiple cryptocurrency exchanges (OKX, Bybit, Deribit) with advanced order simulation capabilities.

## Features

### Core Functionality
- **Multi-Venue Orderbook Display**: Real-time orderbooks from OKX, Bybit, and Deribit
- **WebSocket Integration**: Live data updates with automatic reconnection
- **Order Simulation**: Comprehensive order placement simulation with impact analysis
- **Market Depth Visualization**: Interactive depth charts showing market liquidity
- **Responsive Design**: Optimized for desktop and mobile trading scenarios

### Advanced Features
- **Order Impact Analysis**: Calculate fill percentage, market impact, and slippage
- **Visual Order Positioning**: See exactly where your order would sit in the orderbook
- **Timing Simulation**: Test different order timing scenarios
- **Connection Status Monitoring**: Real-time connection health indicators
- **Error Handling**: Robust error handling with automatic reconnection

## Technical Implementation

### Architecture
- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Charts**: Recharts for market depth visualization
- **WebSocket Management**: Custom hooks for multi-venue connections
- **State Management**: React hooks with proper cleanup

### API Integrations
- **OKX**: WebSocket API v5 for orderbook data
- **Bybit**: WebSocket API v5 for spot trading data
- **Deribit**: WebSocket API v2 for derivatives data

### Key Components
- `OrderbookDisplay`: Real-time orderbook visualization
- `OrderSimulationForm`: Interactive order simulation interface
- `MarketDepthChart`: Depth chart with cumulative volume
- `useOrderbookData`: WebSocket connection management
- `useOrderSimulation`: Order impact calculations

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development
1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000)

### Production Build
\`\`\`bash
npm run build
npm start
\`\`\`

## Usage Guide

### Viewing Orderbooks
1. Select a trading symbol (BTC-USD, ETH-USD, etc.)
2. Switch between venues using the tabs
3. Monitor connection status via colored indicators
4. View real-time bid/ask levels with cumulative volumes

### Simulating Orders
1. Choose venue and symbol
2. Select order type (Market/Limit)
3. Set side (Buy/Sell) and quantity
4. For limit orders, specify price
5. Choose timing simulation (immediate to 30s delay)
6. Click "Simulate Order" to see impact analysis

### Understanding Metrics
- **Fill Percentage**: Likelihood of complete order execution
- **Market Impact**: Price movement caused by the order
- **Slippage**: Difference between expected and actual execution price
- **Estimated Fill Time**: Expected time to complete the order

## API Rate Limiting & Considerations

### Exchange Limits
- **OKX**: 20 requests/2s for public data
- **Bybit**: 10 requests/s for public endpoints
- **Deribit**: 20 requests/s for public data

### Implementation Notes
- WebSocket connections are preferred for real-time data
- Automatic reconnection with exponential backoff
- Error handling for rate limits and connection issues
- Fallback to REST API polling if WebSocket fails

## Technical Decisions

### WebSocket Management
- Separate connections per venue for reliability
- Automatic reconnection with timeout handling
- Connection status monitoring and user feedback

### Order Simulation
- Client-side calculations for immediate feedback
- Realistic market impact modeling
- Warning system for high-risk orders

### Performance Optimizations
- Efficient orderbook updates using React hooks
- Memoized calculations for chart data
- Responsive design with mobile-first approach

## Future Enhancements

### Potential Improvements
- Historical orderbook data analysis
- Advanced order types (Stop-loss, Take-profit)
- Portfolio simulation across multiple venues
- Real-time P&L calculations
- Order book imbalance indicators
- Machine learning for fill time predictions

### Scalability Considerations
- Database integration for historical data
- Redis caching for improved performance
- Microservices architecture for production
- Load balancing for multiple WebSocket connections

## Security & Compliance

### Data Handling
- No sensitive user data stored
- Public market data only
- Secure WebSocket connections (WSS)
- No API keys required for public endpoints

### Privacy
- No user tracking or analytics
- Local state management only
- No data persistence without explicit user consent

## Testing Strategy

### Unit Tests
- Component rendering and interaction
- Hook functionality and state management
- Utility functions and calculations

### Integration Tests
- WebSocket connection handling
- API response parsing
- Error scenarios and recovery

### Performance Tests
- WebSocket message handling under load
- UI responsiveness with rapid updates
- Memory usage optimization

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure build settings
3. Deploy with automatic CI/CD

### Docker
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request with detailed description

### Code Standards
- TypeScript strict mode
- ESLint + Prettier configuration
- Conventional commit messages
- Component documentation

## License

This project is developed as part of the GoQuant recruitment process and is confidential. Not for public distribution.

## Support

For technical questions or issues:
- Review the troubleshooting section
- Check browser console for WebSocket errors
- Verify network connectivity to exchange APIs
- Contact the development team for assistance

---

**Note**: This application is designed for educational and demonstration purposes. It simulates order placement without executing actual trades. Always use proper risk management in live trading environments.
