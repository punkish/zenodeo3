import fs from 'fs';
import path from 'path';

const filesExistInDump = (that, typeOfArchive) => {
    const archive = path.join(that.truebug.dirs.dumps, typeOfArchive);

    return fs.readdirSync(archive)
        .filter(f => path.extname(f) === '.xml');
}

export { filesExistInDump }