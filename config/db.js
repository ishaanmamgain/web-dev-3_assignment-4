const dns = require('dns');
const mongoose = require('mongoose');

// Some Windows setups point Node's own resolver at 127.0.0.1 (no DNS server),
// which breaks mongodb+srv:// lookups even though Windows resolves fine.
// DNS_SERVERS lets us override it without touching system settings.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
}

// Connect once at boot; fail fast so we never listen without a database.
async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
}

module.exports = connectDB;
