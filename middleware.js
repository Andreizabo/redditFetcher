
function changeResponseHeader(req, res, next) {
	res.header("X-Powered-By", "no");
	next();
}

function denyDotDot(req, res, next) {
	if(req.url.indexOf("..") > -1) res.status(400).send("400-no");
	else next();
}

module.exports = { 
	changeResponseHeader: changeResponseHeader,
	denyDotDot: denyDotDot
}
