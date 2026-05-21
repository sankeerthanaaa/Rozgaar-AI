const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const isLocalhost = process.env.MONGO_URI && (process.env.MONGO_URI.includes("localhost") || process.env.MONGO_URI.includes("127.0.0.1"));
    const options = isLocalhost ? {} : {
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
    };
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;