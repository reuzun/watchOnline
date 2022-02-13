import express, { json, urlencoded } from 'express';
const app = express();
import { createServer } from 'http';
const server = createServer(app);
import { Server } from "socket.io";
const io = new Server(server);
import * as path from 'path';

// Setting env variables.
import { config } from 'dotenv';
import { Socket } from 'dgram';

config();
const API_SERVER_PORT = process.env.PORT || 3000;
const URL = process.env.URL || `http://localhost:${API_SERVER_PORT}`

const __dirname = path.resolve(path.dirname(''));

//app.use(express.static(__dirname));
app.use(express.static('public'));
app.use(express.static('model'));
//app.use("/model", express.static('model'));
app.use(json());       // to support JSON-encoded bodies
app.use(urlencoded({ extended: true })); // to support URL-encoded bodies


app.set('view engine', 'ejs');


app.get("/exists", (req, res) => {
    res.sendFile(path.join(__dirname, "\\public\\roomalreadyexists.html"));
});


app.get('/create', (req, res) => {
    let rand = (Math.random() * 9500000) | 0;
    roomDatas[rand] = { vid: CvideoId, time: 1, status: 1 }
    res.redirect(308, `/room/${rand}/video/${CvideoId}`)
});


app.post('/room', (req, res) => {
    if (req.body.create == "Create Room") {
        if (nonfreerooms.includes(req.body.room)) {
            res.redirect(302, `/exists`)
            res.end();
            return;
        }
    }

    res.redirect(308, `/room/${req.body.room}/video/${CvideoId}`)
});


import Message from './model/Message.js';
let CvideoId = "AdIzLj2xCSY";

let nonfreerooms = [];

app.use('/room/:roomId/video/:videoId', (req, res) => {
    res.render('room.ejs', {
        roomId: `${req.params.roomId}`,
        videoId: CvideoId,
        PORT: API_SERVER_PORT,
        URL: URL,
    });
});

io.on("connection", (socket) => {

    socket.userId = createRandomUsername();
    socket.emit("connected", "New Connection occured.", socket.userId)

    socket.on("save", (roomId) => {

        socket.roomId = roomId;

        if (!nonfreerooms.includes(roomId)) nonfreerooms.push(roomId)
        else {
            socket.to(socket.roomId).emit("getCurrent", socket.userId, socket.id);
        }

        socket.join(roomId);

        console.log("Socket " + socket.userId + " succesfully registered to room " + roomId)
    })

    socket.on("roomEnterSeek", (time, vid, playlist, userIdToApply, id) => {
        emitAll(socket, "init", time, vid, playlist, userIdToApply)
    })

    socket.on("message", (userId, message) => {
        let msg = new Message(userId, message, new Date().toTimeString().slice(0, 8));
        emitAll(socket, "newMessage", JSON.stringify(msg))
    });

    socket.on("statusChanged", (status) => {
        socket.to(socket.roomId).emit("statusChange", status)
    })

    socket.on("clientSeek", (time) => {
        socket.to(socket.roomId).emit("seek", time)
    })

    socket.on("videoChange", (link) => {
        emitAll(socket, "newVideo", link);
    })

    socket.on("getPeopleList", async () => {
        const sockets = await io.in(socket.roomId).fetchSockets();
        socket.emit("list", sockets.map(e => e.userId))
        //for(let i = 0; i < sockets.length ; i++)
        //   console.log(sockets[i].userId);
    })

    socket.on("queue", (link, name) => {
        emitAll(socket, "queueReq", link, name)
    })

    socket.on("videoEnded", () => {
        console.log("Video ended request came to server.");
        emitAll(socket, "videoEnd")
    })

});

let emitAll = (socket, eventId, ...eventParams) => {
    socket.to(socket.roomId).emit(eventId, eventParams);
    socket.emit(eventId, eventParams);
}

let createRandomUsername = () => {
    return (100000 + (Math.random() * 999999)) | 0;
};

server.listen(API_SERVER_PORT, () => {
    console.log(`listening on *:${API_SERVER_PORT}`);
});
