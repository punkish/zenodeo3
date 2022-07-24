import got from 'got';
import https from 'https';

const withGot = async (uri) => {
    try {
        let t = process.hrtime();
        const json = JSON.parse((await got(uri)).body);
        t = process.hrtime(t);
        console.log(t, json);
    }
    catch (error) {
        console.error(error);
    }
}

const withHttps = async (uri) => {
    try {
        let t = process.hrtime();
        const json = await getRequest(uri);
        t = process.hrtime(t);
        console.log(t, json);
    }
    catch (error) {
        console.error(error);
    }
}

const getRequest = async (uri) => {
    
    return new Promise((resolve) => {
        https.get(uri, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];
            
            let error;

            /**
             * Any 2xx status code signals a successful response but
             * here we're only checking for 200.
            **/
            if (statusCode !== 200) {
                error = new Error(`ERROR\n${'-'.repeat(50)}\nRequest Failed.\nURI: ${uri}\nStatus Code: ${statusCode}`);
            } 
            else if (!/^application\/json/.test(contentType)) {
                error = new Error(`Invalid content-type.\nExpected application/json but received ${contentType}`);
            }

            if (error) {
                console.error(error.message);

                /**
                 * Consume response data to free up memory
                **/
                res.resume();
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } 
                catch (e) {
                    console.error(e.message);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        });
    });
}

const withHttpsReq = async (uri) => {
    try {
        let t = process.hrtime();
        const json = await getRequest2(uri);
        t = process.hrtime(t);
        console.log(t, json);
    }
    catch (error) {
        console.error(error);
    }
}

const getRequest2 = async (uri)  => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'zenodo.org',
            port: 443,
            path: '/api/records/?q=phylogeny',
            method: 'GET',
            headers: {
            'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } 
                catch (e) {
                    console.error(e.message);
                }
            });
        });
        
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        
        // Write data to request body
        //req.write(postData);
        req.end();
    });
}

const uri = 'https://zenodo.org/api/records/?q=phylogeny';

//withGot(uri);
//withHttps(uri);
withHttpsReq(uri);