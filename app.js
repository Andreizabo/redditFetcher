var fetch = require('node-fetch');
var fs = require('fs');
var path = require('path');
const express = require('express');
const ROUTER = require("./router");
const middleware = require("./middleware.js");

var app = express();

const port = process.env.PORT || 8080

app.use(middleware.denyDotDot);
app.use(middleware.changeResponseHeader);
app.use(ROUTER);

app.listen(port, () => {
	console.log("Server up on port " + port);
});