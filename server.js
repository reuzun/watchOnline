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
        if (availableRooms.includes(req.body.room)) {
            res.redirect(302, `/exists`)
            res.end();
            return;
        }
    }

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
let roomPeople = {};
let roomOldPeople = {};

app.use('/room/:roomId/video/:videoId', (req, res) => {


    res.render('room.ejs', {
        roomId: `${req.params.roomId}`,
        videoId: `${roomDatas[req.params.roomId] ? roomDatas[req.params.roomId].vid : CvideoId}`,
        PORT: API_SERVER_PORT,
        URL: URL,
    });

    if (flag_videoend[req.params.roomId] == undefined)
        flag_videoend[req.params.roomId] = false;
    if (roomPeople[req.params.roomId] == undefined) {
        roomPeople[req.params.roomId] = [];
    }
    if (roomOldPeople[req.params.roomId] == undefined) {
        roomOldPeople[req.params.roomId] = [];
    }
    let username = createRandomUsername();
    // Creating new Room
    if (!availableRooms.includes(req.params.roomId)) {
        io.of(`/room/${req.params.roomId}`).on('connection', (socket) => {

            socket.userId = username;


            if (roomPeople[req.params.roomId] && !roomPeople[req.params.roomId].includes(socket.userId) && !roomOldPeople[req.params.roomId].includes(socket.userId)) {
                roomPeople[req.params.roomId].push(socket.userId);
            }

            handleSocket(socket, req, res)

        });
        availableRooms.push(req.params.roomId)
    } else {
        io.of(`/room/${req.params.roomId}`).on('connection', (socket) => {

            socket.userId = username;

            if (roomPeople[req.params.roomId] && !roomPeople[req.params.roomId].includes(socket.userId) && !roomOldPeople[req.params.roomId].includes(socket.userId)) {
                //console.log('my id : ', socket.userId);
                roomPeople[req.params.roomId].push(socket.userId);
            }

            //console.log(roomPeople[req.params.roomId])


            socket.on('init', (roomId) => {
                socket.emit('seek', roomDatas[req.params.roomId].time, roomDatas[req.params.roomId].status, roomDatas[req.params.roomId].vid, roomChatDatas[req.params.roomId], roomPlaylistText[req.params.roomId], roomPlaylistDatas[req.params.roomId] == null ? [] : roomPlaylistDatas[req.params.roomId]);
            });
            handleSocket(socket, req, res);

        });

    }

});

let createRandomUsername = () => {
    return (100000 + (Math.random() * 999999)) | 0;
};

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

        if (!roomPlaylistText[req.params.roomId]) {
            roomPlaylistText[req.params.roomId] = [];
        }
        roomPlaylistText[req.params.roomId] = playlist;
        if (!roomPlaylistDatas[req.params.roomId]) {
            roomPlaylistDatas[req.params.roomId] = [];
        }
        roomPlaylistDatas[req.params.roomId] = PLAYLIST;
        //console.log(roomPlaylistDatas[req.params.roomId])
        socket.broadcast.emit('queued', playlist, roomPlaylistDatas[req.params.roomId])

    })

    socket.on('videoended', () => {
        if (flag_videoend[req.params.roomId]) {
            setTimeout(() => { flag_videoend[req.params.roomId] = false; }, 2000)
            return;
        }

        try {
            if (roomPlaylistDatas[req.params.roomId].length == 0) return;
        } catch (err) {
            return;
            console.log("err:165")
        }

        //console.log()
        let obj = roomPlaylistDatas[req.params.roomId].shift();
        io.of(`/room/${req.params.roomId}`).emit("videoend", obj, roomPlaylistDatas[req.params.roomId]);

        let ans = obj.substring(obj.lastIndexOf("=") + 1, obj.length);
        roomDatas[req.params.roomId] = { vid: ans, time: 0, status: 1 }
        socket.broadcast.emit('clientVideoChange', ans)



        flag_videoend[req.params.roomId] = true;
    })

    socket.on('playlisthtmldata', (data) => {
        roomPlaylistText[req.params.roomId] = data;
    });


    socket.on('disconnect', () => {
        roomPeople[req.params.roomId] = remove(roomPeople[req.params.roomId], socket.userId, req.params.roomId)

        try {
            if (roomChatDatas[req.params.roomId].endsWith(chat_message("System", `${socket.userId} has left the room.`)))
                return;
        } catch (err) {
            console.log("err193")
        }


        // let str = roomChatDatas[req.params.roomId] + chat_message("System", `${socket.userId} has left the room.`);
        let userId = "System";
        let message = `${socket.userId} has left the room.`;
        //console.log("Gönderildi herkese")
        socket.broadcast.emit('userquit', roomChatDatas[req.params.roomId], userId, message);
        // roomChatDatas[req.params.roomId] = str;


    })

    socket.on("setText", (str) => {
        roomChatDatas[req.params.roomId] = str;
    })

    /*socket.on('reconnect', () => {
        roomPeople[req.params.roomId].push(socket.userId);

        try {
            if (roomChatDatas[req.params.roomId].endsWith(chat_message("System", `${socket.userId} has reconnected to the room.`)))
                return;
        } catch (err) {
            console.log("err193")
        }


        let str = roomChatDatas[req.params.roomId] + chat_message("System", `${socket.userId} has reconnected to the room.`);

        socket.broadcast.emit('newmessage', str);
        roomChatDatas[req.params.roomId] = str;


    })*/

    socket.on('people', () => {
        io.of(`/room/${req.params.roomId}`).emit("showpeople", roomPeople[req.params.roomId]);
    });

    socket.on("myId", () => {
        socket.emit("Id", socket.userId);
    })

    socket.on("skipvideo", (userId) => {
        if (skipvideoflag[socket.userId] == false) {
            return;
        }
        skipvideoflag[socket.userId] = false
        setTimeout(() => {
            skipvideoflag[socket.userId] = true;
        }, 500)
        let vid = roomPlaylistDatas[req.params.roomId].shift();
        roomDatas[req.params.roomId].vid = vid;
        roomDatas[req.params.roomId].time = 0;
        io.of(`/room/${req.params.roomId}`).emit("clientVideoChange", vid, 0, roomPlaylistDatas[req.params.roomId],true);

    })

};

var skipvideoflag = {};
let chat_message = (userId, message) => {
    return '<span class="chatmessage">' + new Date().toTimeString().slice(0, 8) + ` <span class="chatuser" style='color:blue;'>${userId}: </span>${message}` + "</span><br>";
};

function remove(arr, obj, roomId) {

    for (let i = 0; i < arr.length; i++) {
        if (arr[i].toString() == obj.toString()) {
            roomOldPeople[roomId].push(arr.splice(i, 1)[0]);
        }
    }
    return arr;
}
var flag_videoend = {};

//var flag_videoend = false;



server.listen(API_SERVER_PORT, () => {
    console.log(`listening on *:${API_SERVER_PORT}`);
});
