const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Setting env variables.
const dotenv = require('dotenv');
const { Socket } = require('dgram');
dotenv.config();
const API_SERVER_PORT = process.env.PORT || 3000;
const URL = process.env.URL || `http://localhost:${API_SERVER_PORT}`

availableRooms = [];

app.use(express.static('public'));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.sendFile(__dirname, '/public/index.html');
});


app.post('/room', (req, res) => {
  res.redirect(308, `/room/${req.body.room}/video/${CvideoId}`)
});

var globalStatus = 1;
//var globalTime = 0;
var CvideoId = "9VksF2IXlQw";

roomDatas = {}; // Uses key as roomId and an object value as datas including videoId

app.post('/room/:roomId/video/:videoId', (req, res) => {
  
  /*res.render('roomAlternative.ejs', {
    roomId: `${req.body.room}`,
    videoId: `${CvideoId}`,
  });*/

  /*io.of(`/room/${req.body.room}`).on('connection', async (socket)=>{
    // let roomId = socket.handshake.auth.roomId;
    socket.emit('message', `message from room ${req.body.room}`)
  })*/

  res.render('roomAlternative.ejs', {
    roomId: `${req.body.room}`,
    videoId: `${roomDatas[req.body.room] ? roomDatas[req.body.room].vid : CvideoId}`,
    PORT: API_SERVER_PORT,
    URL: URL,
  });
  // Creating new Room
  if (!availableRooms.includes(req.body.room)) {

    io.of(`/room/${req.body.room}`).on('connection', (socket) => {
     
      socket.on('currentTime', (time, vid, roomId) => {
          roomDatas[roomId] = {vid:vid, time:time, status:1} // An if may required
          console.log(roomDatas[roomId].time)
        });

      socket.on('videoChange', (vid, roomId) => {
        roomDatas[roomId] = {vid:vid, time:0, status:1}
        socket.broadcast.emit('clientVideoChange', vid)
      });



      socket.on('statusChanged', (status)=>{
        socket.broadcast.emit('handleStatus', status);
      });

      socket.on('clientSeek', (time)=>{
        socket.broadcast.emit('timeChanged', (time));
      });


      socket.on('getTime', (rid, uid)=>{
        console.log('time'); console.log(roomDatas[rid]?roomDatas[rid].time:'undefined!' )
        socket.emit('comingTime', uid, roomDatas[rid].time)
      })


    });

    availableRooms.push(req.body.room)
  } else { 
    io.of(`/room/${req.body.room}`).on('connection', (socket) => {

      socket.on('init', (roomId)=>{
        socket.emit('seek',  roomDatas[roomId].time,  roomDatas[roomId].status,  roomDatas[roomId].vid);
      });
      
      socket.on('currentTime', (time, vid, roomId) => {
        roomDatas[roomId] = {vid:vid, time:time, status:1} // An if may required
      })

      socket.on('videoChange', (vid, roomId) => {
        roomDatas[roomId] = {vid:vid, time:0, status:1}
        socket.broadcast.emit('clientVideoChange', vid)
      })

      socket.on('statusChanged', (status)=>{
        socket.broadcast.emit('handleStatus', status);
      })

      socket.on('clientSeek', (time)=>{
        socket.broadcast.emit('timeChanged', (time));
      });

      socket.on('getTime', (rid, uid)=>{
        socket.emit('comingTime', uid, roomDatas[rid].time)
      })

    });

    

  }

});




server.listen(API_SERVER_PORT, () => {
  console.log(`listening on *:${API_SERVER_PORT}`);
});
