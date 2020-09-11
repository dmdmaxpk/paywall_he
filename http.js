const http = require('http');
const url = require('url');

const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = "d213db37e96a781c5b5eee1eb000dc6edd1d9ce0264247aea073b16d7daac7efeb30b2949c9845d4549efad77556673f6a16ae81a1725c0dcbffb1c9dc13fed8 ";

// Creating server
const server = http.createServer((req, res) => {
	console.log(`URL requested: ${req.url}`);

	// Setting header
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.writeHead(200, {
		'X-Custom': 'goonj'
	});
	res.writeHead(200, {
		'Access-Control-Allow-Origin': '*'
	});

	console.log('Number: ', req.headers['x-msisdn']);

	// Set the response content
	let msisdn = req.headers['x-msisdn'] ? req.headers['x-msisdn'] : null;

	let gw_transaction_id = 'he_' + makeRandomStr(5) + '_' + getCurrentDate();

	const queryObject = url.parse(req.url, true).query;
	let queryStringObject = JSON.stringify({
		queryObject
	});

	console.log("Query Object", queryStringObject);
	let source = queryObject.source ? queryObject.source : 'none';
	let mid = queryObject.mid ? queryObject.mid : 'none';
	let tid = queryObject.tid ? queryObject.tid : 'none';

	sendReq(req, {
		response_msisdn: msisdn
	}, 'he_requested', gw_transaction_id, source, mid, tid);
	sendRes({
		msisdn: msisdn,
		gw_transaction_id: gw_transaction_id
	});

	let access_token = undefined;
	if (msisdn && msisdn !== null && msisdn !== 'null') {
		let msisdnWithZero = msisdn.replace("92", "0");
		access_token = generateAccessToken(msisdnWithZero);
	}
	res.write(JSON.stringify({
		msisdn: msisdn,
		access_token: access_token
	}));

	// End response
	res.end();
});

generateAccessToken = (msisdn) => {
	const accessToken = jwt.sign({
		msisdn: msisdn
	}, ACCESS_TOKEN_SECRET, {
		expiresIn: '30s'
	});
	return accessToken;
}

function makeRandomStr(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

// Helper functions
function getCurrentDate() {
	var now = new Date();
	var strDateTime = [
		[now.getFullYear(),
			AddZero(now.getMonth() + 1),
			AddZero(now.getDate())
		].join("-"),
		[AddZero(now.getHours()),
			AddZero(now.getMinutes())
		].join(":")
	];
	return strDateTime;
}

function AddZero(num) {
	return (num >= 0 && num < 10) ? "0" + num : num + "";
}


function sendReq(request, body, method, transaction_id, source, mid, tid) {
	const data = JSON.stringify({
		req_body: body,
		source: source,
		mid: mid,
		tid: tid,
		transaction_id: transaction_id,
		service: 'he',
		method: method
	})
	console.log("Request Data", data);
	const options = {
		hostname: 'localhost',
		port: 8000,
		path: '/he/logger/logreq',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': data.length
		}
	}

	const req = http.request(options, (res) => {
		console.log(`Req - StatusCode: ${res.statusCode}`);
	})

	req.on('error', (error) => {
		console.error(error)
	})

	req.write(data)
	req.end()
}

function sendRes(res) {
	const data = JSON.stringify({
		transaction_id: res.gw_transaction_id,
		res_body: res
	})

	const options = {
		hostname: 'localhost',
		port: 8000,
		path: '/he/logger/logres',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': data.length
		}
	}

	const req = http.request(options, (res) => {
		console.log(`Res - StatusCode: ${res.statusCode}`);
	})

	req.on('error', (error) => {
		console.error(error)
	})

	req.write(data)
	req.end()
}

// Listening on port
const port = 5005;
server.listen(port, () => console.log(`Node.js web server running at port ${port}`));