"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
dotenv_1.default.config();
const connectDB = async () => {
    try {
        mongoose_1.default.set('strictQuery', true);
        const envUri = process.env.MONGO_URI;
        const preferredUris = (envUri && envUri.trim().length > 0)
            ? [envUri.trim()]
            : [
                'mongodb://127.0.0.1:27017/ai-recruitment',
                'mongodb://localhost:27017/ai-recruitment',
            ];
        let lastError = null;
        for (const uri of preferredUris) {
            try {
                const conn = await mongoose_1.default.connect(uri);
                console.log(`[DB] Connected (MongoDB): ${conn.connection.host}`);
                return;
            }
            catch (e) {
                lastError = e;
            }
        }
        const mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const memUri = mongoServer.getUri();
        const conn = await mongoose_1.default.connect(memUri);
        console.log(`[DB] Connected (Memory MongoDB): ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};
exports.default = connectDB;
