import express, { json, urlencoded } from 'express';
const app = express();
import { createServer } from 'http';
const server = createServer(app);
import { Server } from "socket.io";
const io = new Server(server);

// Setting env variables.
import { config } from 'dotenv';
import { Socket } from 'dgram';

config();
const API_SERVER_PORT = process.env.PORT || 3000;
const URL = process.env.URL || `http://localhost:${API_SERVER_PORT}`



app.use(express.static('public'));
app.use("/model", express.static('model'));
app.use(json());       // to support JSON-encoded bodies
app.use(urlencoded({ extended: true })); // to support URL-encoded bodies


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.sendFile(__dirname, '/public/index.html');
});


app.post('/room', (req, res) => {
    res.redirect(308, `/room/${req.body.room}/video/${CvideoId}`)
});
/*
import Video from "./model/video.js";
let firstVideo = new Video('9VksF2IXlQw', 0, 1);
console.log(firstVideo)*/
//var CvideoId = firstVideo.videoId;
import Chat from './model/chat.js';

var CvideoId = '9VksF2IXlQw';

let availableRooms = [];

let roomDatas = {}; // Uses key as roomId and an object value as datas including videoId
let roomChatDatas = {};
let roomPlaylistDatas = {};
let roomPlaylistText = {};

app.use('/room/:roomId/video/:videoId', (req, res) => {

    res.render('room.ejs', {
        roomId: `${req.params.roomId}`,
        videoId: `${roomDatas[req.params.roomId] ? roomDatas[req.params.roomId].vid : CvideoId}`,
        PORT: API_SERVER_PORT,
        URL: URL,
    });
    // Creating new Room
    if (!availableRooms.includes(req.params.roomId)) {

        io.of(`/room/${req.params.roomId}`).on('connection', (socket) => {

            handleSocket(socket, req, res)

        });

        availableRooms.push(req.params.roomId)
    } else {
        io.of(`/room/${req.params.roomId}`).on('connection', (socket) => {

            socket.on('init', (roomId) => {
                //console.log(roomPlaylistText[req.params.roomId])
                socket.emit('seek', roomDatas[roomId].time, roomDatas[roomId].status, roomDatas[roomId].vid, roomChatDatas[roomId], roomPlaylistText[req.params.roomId], roomPlaylistDatas[req.params.roomId]);
            });
            handleSocket(socket, req, res);

        });



    }

});

let handleSocket = (socket, req, res) => {
    socket.on('currentTime', (time, vid, roomId) => {
        roomDatas[roomId] = { vid: vid, time: time, status: 1 } // An if may required
    })

    socket.on('videoChange', (vid, roomId) => {
        roomDatas[roomId] = { vid: vid, time: 0, status: 1 }
        socket.broadcast.emit('clientVideoChange', vid)
    })

    socket.on('statusChanged', (status) => {
        socket.broadcast.emit('handleStatus', status);
    })

    socket.on('clientSeek', (time) => {
        socket.broadcast.emit('timeChanged', (time));
    });

    socket.on('getTime', (rid, uid) => {
        socket.emit('comingTime', uid, roomDatas[rid].time)
    })

    socket.on('message', (text) => {
        socket.broadcast.emit('newmessage', text)
        roomChatDatas[req.params.roomId] = text;
    })

    socket.on('queue', (playlist, PLAYLIST, link) => {
        /*if(flag_videoqueue){
            setTimeout(()=>{flag_videoqueue = false;},2000)
            return;
        }*/
        if (!roomPlaylistText[req.params.roomId]) {
            roomPlaylistText[req.params.roomId] = [];
        }
        roomPlaylistText[req.params.roomId] = playlist;
        if (!roomPlaylistDatas[req.params.roomId]) {
            roomPlaylistDatas[req.params.roomId] = [];
        }
        roomPlaylistDatas[req.params.roomId] = PLAYLIST;
        socket.broadcast.emit('queued', playlist, roomPlaylistDatas[req.params.roomId])

        //flag_videoqueue = true;
        //console.log(roomPlaylistDatas[req.params.roomId])
    })

    socket.on('videoended', () => {
        if (flag_videoend) {
            setTimeout(() => { flag_videoend = false;/*console.log(flag)*/ }, 2000)
            return;
        }
        //socket.broadcast.emit("videoend", roomPlaylistDatas[req.params.roomId].pop());
        //console.log(roomPlaylistDatas[req.params.roomId])
        io.of(`/room/${req.params.roomId}`).emit("videoend", roomPlaylistDatas[req.params.roomId].shift());
        flag_videoend = true;
        //console.log(flag)
    })
};

var flag_videoend = false;
var flag_videoqueue = false;


server.listen(API_SERVER_PORT, () => {
    console.log(`listening on *:${API_SERVER_PORT}`);
});
