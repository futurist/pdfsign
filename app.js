
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore');
var assert = require('assert');



var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var app = express();

app.use(bodyParser.urlencoded({limit: '2mb', extended: true })); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json({limit: '2mb'}));

app.use(multer()); // for parsing multipart/form-data



var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}
app.use(allowCrossDomain);

app.post("/pdf", function (req, res) {
  res.send("You sent " + JSON.stringify(req.body) );
  broadcast(req.body);
});

app.listen(3000);
console.log("Listening");


/******** DB part ***********/
// Connection URL
var url = 'mongodb://1111hui.com:27017/test';
var db = null;
MongoClient.connect(url, function(err, _db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");
  db = _db;
  runCmd("phantomjs main.js");
  return true;
});


var insertDoc = function(data, callback) {
  assert.notEqual(null, db, "Mongodb not connected. ");
  var col = db.collection('test31');
  console.log(data);
}

/********* WebSocket Part ************/
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 888 });

wss.on('connection', function connection(ws) {
  ws.on('close', function incoming(code, message) {
    console.log("WS close: ", code, message);
    console.log("now close all process");
    if(db) db.close();
    process.exit(1);
  });
  ws.on('message', function incoming(data) {
    //console.log('received: %s', data);
    var msg = JSON.parse(data);
    var msgid = msg.msgid;
    delete msg.msgid;

    //if(msg.type!='search_result') console.log(msgid, msg);

    var cb = msgid? function  (retJson) {
      ws.send(JSON.stringify( {msgid:msgid, result:retJson} ) );
    } : null;

    insertDoc( msg, cb );
  });

  ws.send('connected to ws');
});
function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send( JSON.stringify(data) );
  });
};



var _DBSIGN = "_MONGODATA";

function _log () {
  for(var i=0; i<arguments.length; i++)
    if(arguments[i]) process.stdout.write(arguments[i].toString());
}
function _logErr () {
  for(var i=0; i<arguments.length; i++)
    if(arguments[i]) process.stderr.write(arguments[i]);
}

function genPDF ( infile, imagefile, outfile ) {
	//pdftoppm -rx 150 -ry 150 -png file.pdf prefix
  exec('./mergepdf.py -i '+ infile +'.pdf -m '+imagefile+'.pdf -o '+ outfile +'.pdf ', function (error, stdout, stderr) {
    console.log(stdout);
  });

}


function runCmd (cmd, dir, callback) {

  var args = cmd.split(" ");
  var command = args[0];

  args.shift();

  var proc = spawn(command,   ["--config", "config"].concat(args), {
    cwd: (dir?dir:__dirname),
    stdio: "pipe",
  });

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', function (data) {

      console.log(data);
      if( data && ( new RegExp ("^"+_DBSIGN) ).test(data) ) {
        var d = JSON.parse(data.split(_DBSIGN)[1]);
        if(d.type=="genPDF"){
          genPDF("font", d.image, "out");
        }
      }else{
        //_log(data);
      }
  });

  proc.stderr.on('data', function (data) {
    _logErr(data);
  });

  proc.on('close', function (code) {
    if(db) db.close();
    console.log('app exited with code ' + code);
  });

  proc.on("error", function (e) {
    console.log(e);
    process.exit(1);
  });

}



