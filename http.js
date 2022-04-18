const http = require('http');
const url = require('url');

const HARD_TOKEN = "I3zrSLC0eK5aKBCCmO1D.9uVrgDWfltvbthuirham.Zkd7whBHLKwMJgvt45oc.XVxPBgEBvyTB";

// Creating server
const server = http.createServer((req, res) => {
	//console.log(`URL requested: ${req.url}`);

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

	console.log('Encrypted MSISDN: ', req.headers['x-encryptid']);
	//console.log('Unencrypted MSISDN: ', req.headers['x-encryptid']);
	getUnencryptedMsisdn(req.headers['x-encryptid'])
	

	// Set the response content
	let msisdn = req.headers['x-msisdn'] ? req.headers['x-msisdn'] : null;

	let gw_transaction_id = 'he_' + makeRandomStr(5) + '_' + getCurrentDate();

	const queryObject = url.parse(req.url, true).query;
	let queryStringObject = JSON.stringify({
		queryObject
	});

	//console.log("Query Object", queryStringObject);
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

	if (msisdn && msisdn !== null && msisdn !== 'null') {
		let msisdnWithZero = msisdn.replace("92", "0");
		handleRequest(msisdnWithZero, msisdn, res);
	}else{
		res.write(JSON.stringify({msisdn: msisdn}));
		res.end();
	}
});

handleRequest = async(msisdnWithZero, numberWithoutZero, response) => {
	const data = JSON.stringify({msisdn: msisdnWithZero});
	const options = {hostname: 'localhost',port: 3000,path: '/auth/he/token',method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer '+HARD_TOKEN,
			'Content-Length': data.length
		}
	}
	
	let accessToken = undefined;
	let refreshToken = undefined;
	let req = http.request(options, (res) => {
		res.on('data', function (tokens) {
			tokens = JSON.parse(tokens.toString());
			if(tokens){
				accessToken = tokens.access_token;
				refreshToken = tokens.refresh_token;
				
				//console.log(tokens);
			}
			
			response.write(JSON.stringify({msisdn: numberWithoutZero,access_token: accessToken,refresh_token: refreshToken}));
			response.end();
		});
	});

	req.on('error', (error) => {
		response.write(JSON.stringify({msisdn: numberWithoutZero}));
		response.end();
	});

	req.write(data);
	req.end();
	
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

function getUnencryptedMsisdn(msisdn) {
	http.get(`http://hedecrypt.goonj.pk/hedecrypt/index.php?msisdn=${msisdn}`, (res) => {
		console.log(res);
	})
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
	//console.log("Request Data", data);
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
		//console.log(`Req - StatusCode: ${res.statusCode}`);
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
		//console.log(`Res - StatusCode: ${res.statusCode}`);
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