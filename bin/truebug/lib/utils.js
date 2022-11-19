import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;

const pathToXml = (xml) => {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    const dir = `${truebug.dirs.archive}/${one}/${two}/${thr}`;

    return dir;
}

const stack = {};

const incrementStack = (mod, fn) => {
    const incrFn = (fn) => {
        if (fn in stack[mod]) {
            stack[mod][fn]++;
        }
        else {
            stack[mod][fn] = 1;
        }
    }

    if (!(mod in stack)) {
        stack[mod] = {};
    }
    
    incrFn(fn);
}
export { pathToXml, stack, incrementStack }