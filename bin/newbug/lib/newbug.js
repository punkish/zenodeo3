import { Config } from '@punkish/zconfig';
const config = new Config().settings;
//import Zlogger from '@punkish/zlogger';
import Zlogger from '../../../../zlogger/index.js';

export default class Newbug {
    constructor({ loglevel }) {
        
        // Include all the truebug config settings into the object instance
        this.config = JSON.parse(JSON.stringify(config.truebug));
        
        // Add settings for the db, and set the provided loglevel
        this.config.db = config.db;
        this.config.log.level = loglevel;
        
        // Remove the prefix from each log line
        this.config.log.snipPrefix = 'bin/newbug';

        // Initialize the logger
        this.log = new Zlogger(this.config.log);

        // A stats object to store the number of treatments and 
        // its components extracted from the XMLs
        this.stats = {
            typeOfArchive: '',
            timeOfArchive: 0,
            sizeOfArchive: 0,
            downloadStarted: 0,
            downloadEnded: 0,
            unzipStarted: 0,
            unzipEnded: 0,
            numOfFiles: 0,
            etlStarted: 0,
            etlEnded: 0,
            treatments: 0,
            treatmentCitations: 0,
            materialCitations: 0,
            collectionCodes: 0,
            figureCitations: 0,
            bibRefCitations: 0,
            treatmentAuthors: 0,
            journals: 0
        };

        //this.archives = [ 'yearly', 'monthly', 'weekly', 'daily' ];
    }

    async download () {
        this.stats.downloadStarted = new Date().getTime();
        const typeOfArchive = this.stats.typeOfArchive;

        const remoteArchive = typeOfArchive === 'yearly' 
            ? 'plazi.zenodeo.zip'
            : `plazi.zenodeo.${typeOfArchive}.zip`;
            

        // example
        //
        // "server": {
        //     "hostname": 'https://tb.plazi.org',
        //     "path": 'GgServer/dumps',
        //     "port": 443
        // },

        // https://tb.plazi.org/GgServer/dumps/plazi.zenodeo.daily.zip
        const pathToArchive = `${truebug.server.path}/${remoteArchive}`;
        const url = `${truebug.server.hostname}/${pathToArchive}`;
        this.log.info(`checking for "${remoteArchive}" on the server…`);

        try {
            const res = await got(url, { method: 'HEAD' });
            const headers = res.headers;
            const d = new Date(headers['last-modified']);
            const timeOfArchive = d.toISOString().split('T')[0];
            const archive_name = `${typeOfArchive}.${timeOfArchive}`;
            const localCopy = `${truebug.dirs.zips}/${archive_name}.zip`;

            this.stats.timeOfArchive = timeOfArchive;
            this.stats.sizeOfArchive = Number(headers['content-length']);

            if (!fs.existsSync(localCopy)) {
                this.log.info(`downloading ${archive_name}…`);

                if (truebug.mode !== 'dryRun') {
                    await streamPipeline(
                        got.stream(url),
                        fs.createWriteStream(localCopy)
                    );
                }
                
            }

        }
        catch (error) {
            
            if (error.response.statusCode) {
                this.log.info('there is not\n');
            }
            
        }
        
        this.stats.downloadEnded = new Date().getTime();
    }

    unzip () {
        this.stats.unzipStarted = new Date().getTime();

        const typeOfArchive = this.stats.typeOfArchive;
        const timeOfArchive = this.stats.timeOfArchive;

        const archive_name = `${typeOfArchive}.${timeOfArchive}`;
        this.log.info(
            `checking if "${archive_name}" has already been unzipped…`, 
        );

        const archive_dir = `${truebug.dirs.data}/treatments-dumps/${archive_name}`;
        
        if (fs.existsSync(archive_dir)) {
            this.log.info('yes, it has been');
        }
        else {
            this.log.info("no, it hasn't");
            this.log.info(`unzipping "${archive_name}.zip"…`);
            const archive = `${truebug.dirs.zips}/${archive_name}.zip`;
        
            // -q Perform operations quietly.
            // -n never overwrite existing files
            // -d extract files into exdir
            //
            let cmd = `unzip -q -n ${archive} -d ${archive_dir}`;
        
            if (truebug.mode !== 'dryRun') {
                execSync(cmd);
                
                // check if there is an index.xml included in the archive; 
                // if yes, remove it
                //
                if (fs.existsSync(`${archive_dir}/index.xml`)) {
                    fs.rmSync(`${archive_dir}/index.xml`);
                }
            }

        }

        const files = fs.readdirSync(archive_dir)
            .filter(f => path.extname(f) === '.xml');

        this.stats.unzip.numOfFiles = files.length;
        this.stats.unzip.ended = new Date().getTime();
        this.log.info(`downloaded archive contains ${files.length} files`);

        return files;
    }
}