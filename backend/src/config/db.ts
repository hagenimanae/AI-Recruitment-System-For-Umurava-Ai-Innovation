import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const envUri = process.env.MONGO_URI;
    const preferredUris = (envUri && envUri.trim().length > 0)
      ? [envUri.trim()]
      : [
          'mongodb://127.0.0.1:27017/ai-recruitment',
          'mongodb://localhost:27017/ai-recruitment',
        ];

    let lastError: any = null;
    for (const uri of preferredUris) {
      try {
        const conn = await mongoose.connect(uri);
        console.log(`[DB] Connected (MongoDB): ${conn.connection.host}`);
        return;
      } catch (e: any) {
        lastError = e;
      }
    }

    const mongoServer = await MongoMemoryServer.create();
    const memUri = mongoServer.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[DB] Connected (Memory MongoDB): ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
