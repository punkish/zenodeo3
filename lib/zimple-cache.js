import Zlogger from '@punkish/zlogger';
const log = new Zlogger({
    "level"     : "info",
    "transports": [ "console" ],
    "name"      : "ZCACHE"
});

const CACHE = new Map();

function cache({ segment, key, val }) {

    if (val) {

        if (CACHE.has(segment)) {
            const _segment = CACHE.get(segment);
            _segment.set(key, val);
        }
        else {
            const _segment = new Map();
            _segment.set(key, val);
            CACHE.set(segment, _segment);
        }

        log.info(`cache set 🔨 -- segment: ${segment}, key: ${key}`);
        return val;

    }
    else {

        if (CACHE.has(segment)) {
            const _segment = CACHE.get(segment);
    
            if (_segment.has(key)) {
                log.info(`cache hit 💥 -- segment: ${segment}, key: ${key}`);
                return _segment.get(key);
            }
            else {
                log.info(`cache miss ‽ -- segment: ${segment}, key: ${key}`);
                return false
            }
    
        }

    }

}

export { cache };

// let res = cache({ segment: 'images', key: 'params' });
// console.log(`res1: ${res}`);
// res = cache({ segment: 'images', key: 'params', val: ['foo', 'bar'] });
// console.log(`res2: ${res}`);
// res = cache({ segment: 'images', key: 'params' });
// console.log(`res3: ${res}`);
// res = cache({ segment: 'images', key: 'params', val: 42 });
// console.log(`res4: ${res}`);
// res = cache({ segment: 'images', key: 'params' });
// console.log(`res5: ${res}`);
// res = cache({ segment: 'images', key: 'params' });
// console.log(`res6: ${res}`);