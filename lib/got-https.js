import got from 'got';
import https from 'https';

const withGot = async (uri) => {
    try {
        let t = process.hrtime();
        const res = await got(uri);
        const json = JSON.parse(res.body);
        t = process.hrtime(t);
        console.log(t);
        console.log(json);
    }
    catch (error) {
        console.error(error);
    }
}

const withHttps = async (uri) => {
    let t = process.hrtime();
    const json = await getRequest(uri);
    t = process.hrtime(t);
    console.log(t);
    console.log(json);
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
                error = new Error(`Request Failed.\nURI: ${uri}\nStatus Code: ${statusCode}`);
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

const uri = 'https://zenodo.org/api/records/?q=phylogeny&page=1&size=30&type=image&communities=biosyslit&subtype=figure&subtype=photo&subtype=drawing&subtype=diagram&subtype=plot&subtype=other';

withGot(uri);
withHttps(uri);