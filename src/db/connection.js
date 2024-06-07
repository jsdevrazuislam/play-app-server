import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectedDB = async () =>{
    try {
        const dbUrl = `${process.env.MONGODB_URI}/${DB_NAME}`;
        const connectionInstance = await mongoose.connect(dbUrl);
        console.log(`MongoDB Connection Successfully ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log('MongoDB Connection Error', error);
        process.exit(1)
    }
}

export default connectedDB