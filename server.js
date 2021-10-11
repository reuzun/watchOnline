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
var CvideoId = firstVideo.videoId;

let availableRooms = [];
let roomDatas = {}; // Uses key as roomId and an object value as datas including videoId

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

      socket.on('currentTime', (time, vid, roomId) => {
        roomDatas[roomId] = { vid: vid, time: time, status: 1 } // An if may required
      });

      socket.on('videoChange', (vid, roomId) => {
        roomDatas[roomId] = { vid: vid, time: 0, status: 1 }
        socket.broadcast.emit('clientVideoChange', vid)
      });



      socket.on('statusChanged', (status) => {
        socket.broadcast.emit('handleStatus', status);
      });

      socket.on('clientSeek', (time) => {
        socket.broadcast.emit('timeChanged', (time));
      });


      socket.on('getTime', (rid, uid) => {
        socket.emit('comingTime', uid, roomDatas[rid].time)
      })


    });

    availableRooms.push(req.params.roomId)
  } else {
    io.of(`/room/${req.params.roomId}`).on('connection', (socket) => {

      socket.on('init', (roomId) => {
        socket.emit('seek', roomDatas[roomId].time, roomDatas[roomId].status, roomDatas[roomId].vid);
      });

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

    });



  }

});




server.listen(API_SERVER_PORT, () => {
  console.log(`listening on *:${API_SERVER_PORT}`);
});
