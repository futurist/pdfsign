

//phantomjs module
var proc = require("child_process");
var sys = require("system");
var fs = require('fs');
var server = require('webserver').create();
var page = require("webpage").create();


var spawn = proc.spawn;
var execFile = proc.execFile;
var ws;

if( sys.args.indexOf('nows')>-1 ){

	setTimeout(init, 500);

}else{

	ws = new WebSocket('ws://localhost:888');
	ws.onopen = function (e) {
		ws.onerror = function (e) {

			console.log(e);
		}
		ws.onmessage = function (e) {
			if( ! /^\s*{/.test( e.data ) ) return;
	        var d=JSON.parse(e.data);
	        var callObj= wsQueue[d.msgid];
	        if(callObj){
	            callObj[1].call(callObj[0], d.result);
	            delete wsQueue[d.msgid];
	        }
	        if(d.type=="img"){
	        	openCanvas(d);
	        }

		}
		ws.onclose = function (code, reason, bClean) {
			console.log("ws error: ", code, reason);
			phantom.exit();
		}
		init();
	}

}


var wsQueue={};

function wsend(json, that, callback){

	if(callback){
	    json.msgid = (+new Date()) + (Math.random().toString().slice(-4) );
	    wsQueue[json.msgid] = [that, callback];
	}

	if(ws) {
		ws.send(JSON.stringify(json));
	} else {
		console.log(_DBSIGN, JSON.stringify(json) );
	}
}



function paramToJson(str) {
    return str.split('&').reduce(function (params, param) {
        var paramSplit = param.split('=').map(function (value) {
            return decodeURIComponent(value.replace(/\+/g, ' '));
        });
        params[paramSplit[0]] = paramSplit[1];
        return params;
    }, {});
}

var DATA_FOLDER = "DATA";	// the folder name to save txt and jpg
var _MSGSIGN = "_PHANTOMDATA";
var _DBSIGN = "_MONGODATA";
var RES_TIMEOUT = 10000;


function DB_MSG (json) {
	console.log(_DBSIGN, JSON.stringify(json) );
}


function openCanvas(data, config) {

	var pdfWidth = data.pdfWidth;
	var pdfHeight = data.pdfHeight;
	var page = require('webpage').create();
	page.settings.userAgent = 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36';
	page.settings.resourceTimeout = RES_TIMEOUT;

	page.viewportSize = { width: pdfWidth || 1000, height: pdfHeight ||800 };
	//page.viewportSize = { width: 1000, height: 800 };

	function EXIT( exist ){
		setTimeout(function(){
			page.close();
		}, 300);
	}

	function whiteBG () {
		page.evaluate(function() {
			var head = document.querySelector('head');
			  style = document.createElement('style');
			  text = document.createTextNode('body { background: #fff }');
			style.setAttribute('type', 'text/css');
			style.appendChild(text);
			head.insertBefore(style, head.firstChild);
		});
	}

	function renderPage (filepath) {


		// page.paperSize = {
		//   width: '8.5in',
		//   height: '11in',
		//   margin:{ top:"5cm", bottom:"1cm"},
		// }

		DATA_FOLDER = ".";
		filepath = "image";
		page.render( DATA_FOLDER + "/" + filepath+".pdf", {format:'pdf', quality:'100' });
		console.log("render page:",  filepath+".pdf");
		DB_MSG({type:"genPDF", image:filepath });

	}

	page.onConsoleMessage=function(data){
		if( ( new RegExp ("^"+_DBSIGN) ).test(data) ){
			var d = JSON.parse(data.split(_DBSIGN)[1]);
			wsend(d);
		}

		if( ( new RegExp ("^"+_MSGSIGN) ).test(data) ){

			var d = JSON.parse(data.split(_MSGSIGN)[1]);

			if(d.cmd=="save"){
				renderPage(+new Date() );
				EXIT();
			}
			if(d.cmd=="contactData"){
				fs.write( filebase + "_email.txt", JSON.stringify(d) +"\n\n", 'a');
			}
			if(d.cmd=="EXIT") {
				EXIT();
			}

		}else{
			console.log(data);
		}
	}


	page.onResourceRequested = function(data, req) {
		return;
		var header = {};
		_.each(data.headers, function(v){ header[v.name] = v.value; } );
		console.log(data.id, data.method, _.keys(header));
		if( header["X-Requested-With"] == "XMLHttpRequest" ) return;
	  	if(data.id>1) req.abort();
	};


	page.onResourceTimeout = function(request) {
	    //console.log('Response (#' + request.id + '): ' + JSON.stringify(request));
	};

	page.onResourceError = function(resErr) {
		if( /Operation canceled/i.test(resErr.errorString) ) return;
		console.log('Unable to load resource (#' + resErr.id + 'URL:' + resErr.url + ')');
		console.log('Error code: ' + resErr.errorCode + '. Description: ' + resErr.errorString);
		//Error code: 99. Description: Connection timed out

		if(resErr.url==url){	//The main url, when timeout or error

		}
	};


	function pageFailed (reason) {
		console.log(url, "#############FAILED!!###############");
		page.stop();

	}

	page.onLoadFinished = onLoadFinished;

	function onLoadFinished(status){
		if(status=="fail"){
			pageFailed();
			return;
		}


		var c = page.evaluate( function( data, pdfWidth, _MSGSIGN, _DBSIGN) {

			function sendMSG (json) {
				console.log(_MSGSIGN, JSON.stringify(json) );
			}

			var c1 = document.querySelector('#c1');

			var img = new Image();

			img.onload=function  () {
				var w = img.width;
				var h = img.height;
				var scale = pdfWidth/w;
				w=Math.round(w*scale);
				h=Math.round(h*scale);
				c1.width = w;
				c1.height = h;
				c1.style.width = w+"px";
				c1.style.height = h+"px";
				var ctx = c1.getContext('2d');
				ctx.drawImage(img, 0, 0, img.width, img.height, 0,0,w,h);
				sendMSG({cmd:"save"});
			}

			img.src = data;


		}, data.src, pdfWidth, _MSGSIGN, _DBSIGN);

	}

	page.open("canvas.html");

}



function init () {
	console.log("phantomjs start.");


}
