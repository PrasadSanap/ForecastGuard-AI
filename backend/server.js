require('dotenv').config();
const app = require('./app');
const connectDB = require('./utils/db');

const PORT = process.env.PORT || 5000;

(async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Copy .env.example to .env and set it.');
    process.exit(1);
  }
  try {
    await connectDB();
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`ForecastGuard API (DEMONSTRATION MODE) on :${PORT}`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
})();