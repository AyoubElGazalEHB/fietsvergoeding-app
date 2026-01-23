require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth.routes');
const rideRoutes = require('./routes/ride.routes');
const hrRoutes = require('./routes/hr.routes');
const trajectoryRoutes = require('./routes/trajectory.routes');

// Import jobs
const monthlyExportJob = require('./jobs/monthlyExport.job');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/trajectories', trajectoryRoutes);
app.use('/api', hrRoutes);
app.use('/api', require('./routes/employee.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Schedule monthly export job (runs on 1st of every month at 02:00)
cron.schedule('0 2 1 * *', () => {
  console.log('Running monthly export job...');
  monthlyExportJob.runExport();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});