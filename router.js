var fetch = require('node-fetch');
var fs = require('fs');
var path = require('path');
const express = require('express');
var mysql = require('mysql');
var schedule = require('node-schedule');

var multer  = require('multer');
var upload = multer();

var router = express.Router();

var pool = mysql.createPool({
	host: "localhost",
	user: "root",
	password: "root",
	database: "mydb"
});

var downMemz = schedule.scheduleJob('*/10 * * * *', function() {
	console.log("Searching for new memes");
	downloadNewMeme("hot");
});

router.get("/memes", (req, res) => {
	var pgNr = req.query.pageNumber;
	if(!pgNr || pgNr < 0) res.redirect("/memes?pageNumber=0");
	res.writeHead(200, {'Content-Type': 'text/html'});
	pool.getConnection(function(err, connection) {
		if(err) throw err;
		if(pgNr) {
			registerIP(req.connection.remoteAddress, connection);
			var cmd = "SELECT * FROM memes WHERE memeID > (SELECT MAX(memeID) FROM memes) - ? AND memeID < (SELECT MAX(memeID) FROM memes) - ?";
			//console.log(cmd);
			connection.query(cmd, [
				(parseInt(parseInt(pgNr)+1) * 10).toString(),
				(pgNr * 10 - 1).toString()
			], function(err, result) {
				if(err) {
					console.log(pgNr);
					console.log(cmd);
					throw err;
				}
				connection.release();
				var i = 0;
				var stack = [];
				while(result[i]) {
					if(result[i].name) {
						var tokens = result[i].memePath.toString().split("$")[0].split("\\");
						var s= tokens[tokens.length - 1];
						stack.push("<img src = \"" + "/memes/" + result[i].tags + "$" + result[i].name.toString() + "\"title=" + s + " style=\"max-width: 60%; height: auto; padding: 5px; display: block; margin-left: auto; margin-right: auto;\"></img><br><br><hr><br>"); 
					}
					i++;
				}
				for(i = stack.length - 1; i >= 0; i--) {
					res.write(stack[i]);
				}
				if(parseInt(pgNr) > 0)
					res.write("<a href=\"/memes?pageNumber=" + (pgNr-1) + "\" style=\"position: fixed; top: 50; left: 50;\"> PREVIOUS <\/a>");
				if(stack.length == 10)
					res.write("<a href=\"/memes?pageNumber=" + parseInt(parseInt(pgNr)+1) + "\" style=\"position: fixed; top: 70; left: 50;\"> NEXT <\/a>");
				res.end();
			});
		}
		else connection.release(); 
	});
});

router.get("/memes/id/:id", (req, res) => {
	pool.getConnection(function(err, connection) {
		if(err) throw err;
		registerIP(req.connection.remoteAddress, connection);
		var search = "SELECT * FROM memes WHERE memeID = ?";
		connection.query(search, [
			req.params.id.toString()
		], function(err, result) {
			if(err) throw err;
			if(result[0]) {
				var tokens = result[0].name.toString().split(".");
				var ext = tokens[tokens.length - 1];
				res.writeHead(200, {'Content-Type' : 'image/' + ext });
				fs.readFile(result[0].memePath, function(err, data) {
					if(err) throw err;
					res.write(data);
					res.end();
				});
			}
			else {
				res.sendStatus(404);
			}
		});
	});
});
	
router.get('*', function(req, res) {
	let fileName = path.join(__dirname, req.url);
	let token = req.url.split("/");
	console.log(req.url);
	fs.stat(fileName, (err, stats) => {
    if(err || stats.isDirectory() || (token[1] != "memes" && !token[3])) {
        res.sendStatus(404);
		console.log(err + " " + fileName);
		console.log(token[1]);
    } else {
        res.sendFile(fileName);
    }
	});
});

router.all("*", (req, res) => {
    res.stats(418).send("I'm a teapot");
});

function registerIP(ip, connection) {
	var sel = "SELECT * FROM meme_IPs WHERE IP = ?";
	var datetime = new Date();
	connection.query(sel, [
		ip.toString()
	], function(err, result) {
		if(err) throw err;
		var inc = "INSERT INTO meme_IPs (last_date, IP, Access_NMB) VALUES(?, ?, 1)";
		if(result[0]) inc = "UPDATE meme_IPs SET Access_NMB = Access_NMB + 1, last_date = ? WHERE IP = ?";
		connection.query(inc, [
			datetime,
			ip.toString()
		], function(err, result) {
			if(err) throw err;
			console.log(result);
		});
	});
}

function downloadNewMeme(source) {
	if(!source) source = "hot";
	fetch('https://www.reddit.com/r/memes/' + source +  '/.json?limit=10')
		.then(res => res.json())
		.then(json => {
			json.data.children.forEach(element => {
				var tokens = (element.data.url).split("/");
				var name = tokens[tokens.length - 1];
				//var memeName = path.join(__dirname + "/memes/" + name);
				if(name) {
					pool.getConnection(function(err, connection) {
						if(err) throw err;
						var check = "SELECT * FROM memes WHERE name = ?"
						connection.query(check, [
							name
						], function(err, result) {
							//connection.release();
							if(err) throw err;
							if(!result[0]) {
								var memePath = path.join(__dirname + "/memes/" + source + "$" + name);
								downloadFile(element.data.url, memePath);
								var go = "INSERT INTO memes (memePath, tags, name) VALUES (?, ?, ?)";
								console.log(go);
								connection.query(go, [
									memePath.replace(/\\/g, "\\"),
									source,
									name
								], function(err, result) {
									connection.release();
									if(err) throw err;
									console.log(result);
								});
							}
							else connection.release();
						});
					});
				}
			});
		});
}

const downloadFile = (async (url, path) => {
	const res = await fetch(url);
	const fileStream = fs.createWriteStream(path);
	await new Promise((resolve, reject) => {
		  res.body.pipe(fileStream);
		  res.body.on("error", (err) => {
			reject(err);
		  });
		  fileStream.on("finish", function() {
			resolve();
		  });
	});
});

function createdDate (file) {  
  const { birthtime } = fs.statSync(file)
  return birthtime
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = router;