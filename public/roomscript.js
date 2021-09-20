import { io } from "/socket.io-client";
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT;

const socket = io(`http://localhost:${PORT}`);
console.log(PORT);