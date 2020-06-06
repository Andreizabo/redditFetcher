
function changeResponseHeader(req, res, next) {
	res.header("X-Powered-By", "get-a-life");
	next();
}

function denyDotDot(req, res, next) {
	if(req.url.indexOf("..") > -1) res.status(400).send("Epstein didn't kill himself");
	else next();
}

module.exports = { 
	changeResponseHeader: changeResponseHeader,
	denyDotDot: denyDotDot
}