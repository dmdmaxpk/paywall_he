const http = require('http');

// Creating server
const server = http.createServer((req, res) => {
	console.log(`URL requested: ${req.url}`);

	// Setting header
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.writeHead(200, { 'X-Custom': 'goonj' });
	res.writeHead(200, {'Access-Control-Allow-Origin': '*'});

	console.log('Number: ', req.headers['x-msisdn']);

	// Set the response content
	let msisdn = req.headers['x-msisdn'] ? req.headers['x-msisdn'] : null;
	res.write(JSON.stringify({ msisdn }));

	// End response
	res.end();
});

// Listening on port
const port = 5005;
server.listen(port, () => console.log(`Node.js web server running at port ${port}`));