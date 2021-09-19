const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Setting env variables.
const dotenv = require('dotenv');
dotenv.config();
const API_SERVER_PORT = process.env.PORT

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
var globalTime = 0;
var CvideoId = "9VksF2IXlQw";
app.post('/room/:roomId/video/:videoId', (req, res) => {
  
  res.render('roomAlternative.ejs', {
    roomId: `${req.body.room}`,
    videoId: `${CvideoId}`,
  });

  // Creating new Room
  if (!availableRooms.includes(req.body.room)) {


    io.on('connection', (socket) => {

      socket.on('currentTime', (time, vid) => {
        if (time > globalTime) {
          globalTime = time;
        }
      })

      socket.on('videoChange', (vid) => {
        globalTime = 0;
        CvideoId = vid;
        io.emit('clientVideoChange', CvideoId)
      })

      socket.on('statusChanged', (status)=>{
        globalStatus = status;
      })

      socket.on('statusChanged', (status)=>{
        globalStatus = status;
        socket.broadcast.emit('handleStatus', status);
      })


    });

    availableRooms.push(req.body.room)
  } else { 
    io.on('connection', (socket) => {
      socket.on('init', ()=>{
        io.emit('seek', globalTime, globalStatus, CvideoId);
      });
      
      socket.on('currentTime', (time, vid) => {
        if (time > globalTime) {
          globalTime = time;
        }
      })

      socket.on('videoChange', (vid) => {
        globalTime = 0;
        CvideoId = vid;
        io.emit('clientVideoChange', CvideoId)
      })

      socket.on('statusChanged', (status)=>{
        globalStatus = status;
        socket.broadcast.emit('handleStatus', status);
      })

    });

  }

});




server.listen(API_SERVER_PORT, () => {
  console.log(`listening on *:${API_SERVER_PORT}`);
});