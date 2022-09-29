import { Config } from '@punkish/zconfig';
const config = new Config().settings;

const pathToXml = (xml) => {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    const dir = `${config.truebug.dirs.archive}/${one}/${two}/${thr}`;

    return dir;
}

export { pathToXml }