import { Cache } from './index.js';

const test_sync = () => {
    const cache_sync = new Cache({ duration: 1 * 24 * 3600 * 1000 });

    console.log("// cache_sync.rm('foo')");
    let res = cache_sync.rm('foo');
    let msg = res
        ? '// removed cache successfully'
        : '// nothing to remove';
    console.log(msg, '\n');
    
    console.log("// cache_sync.get('foo')");
    res = cache_sync.get('foo');
    msg = res
        ? '// got cached value'
        : '// nothing to get';
    console.log(msg, '\n', res, '\n');

    console.log("// cache_sync.set('foo', 'update the cache')");
    res = cache_sync.set('foo', 'update the cache');
    msg = res
        ? '// set cache successfully'
        : '// cache failed';
    console.log(msg, '\n', res, '\n');

    console.log("// cache_sync.get('foo')");
    res = cache_sync.get('foo');
    msg = res
        ? '// got cached value'
        : '// nothing to get';
    console.log(msg, '\n', res, '\n');
}

const test_async = async () => {
    const cache_async = new Cache({ 
        duration: 10000, namespace: 'long', sync: false 
    });

    // console.log("// cache_async.get('foo')");
    // let foo = await cache_async.get('foo');
    // console.log(foo, '\n');

    console.log("// cache_async.set('foo', 'yet another update')");
    let foo = await cache_async.set('foo', 'yet another update');
    foo = await cache_async.set('bar', 'bumblebee');
    foo = await cache_async.set('baz', 'buzzfeed');
    // if (foo) {
    //     console.log('\n');
    //     console.log("// cache_async.get('foo')");
    //     foo = await cache_async.get('foo');
    //     console.log(foo, '\n');
    // }

    // console.log("// cache_async.keys()");
    // const keys = await cache_async.keys();
    // console.log(keys, '\n');

    console.log("// cache_async.all()");
    let all = await cache_async.all();
    console.log(all, '\n');

    console.log("// cache_async.delete('bar')\n");
    await cache_async.delete('bar');

    console.log("// cache_async.all()");
    let alls = await cache_async.all();
    console.log(alls, '\n');

    const opts = await cache_async.opts();
    console.log(opts);

    // console.log("// cache_async.has('foo')");
    // const has = await cache_async.has('foo');
    // console.log(has);

    // console.log("// cache_async.rm('foo')");
    // const rm = await cache_async.rm('foo');
    // console.log(rm);

    // console.log("// cache_async.get('foo')");
    // foo = await cache_async.get('foo');
    // console.log(foo, '\n');

    // console.log("// cache_async.clear('long')");
    // const clear = await cache_async.clear('long');
    // console.log(clear);
}

test_sync();


/*
console.log("// cache.set('foo', 'my first cached value')");
let res = cache1.set('foo', 'my first cached value');
if (res) console.log('stored successfully\n');

console.log("// cache.set('bar', 'my first long cached value')");
res = cache2.set('bar', 'my first long cached value');
if (res) console.log('stored successfully\n');

console.log("// cache.get('foo')");
foo();

if (res) console.log(res);
console.log('\n');

console.log("// cache.keys()");
console.log(JSON.stringify(cache1.keys(), null, 4));
console.log('\n');

console.log("// cache.all()");
console.log(cache1.all());
console.log('\n');

console.log("// cache.rm('bar')");
res = cache1.rm('bar');
if (res) console.log('removed successfully');
console.log('\n');

console.log("// cache.has('foo')");
console.log(`${cache1.has('foo') ? 'foo exists' : "foo doesn't exist"}`);
console.log('\n');

// console.log("// cache.get('foo')");
// setTimeout(() => cache.get('foo'), 6000);
// res = cache.get('foo');
// if (res) console.log(res);
// console.log('\n');

// console.log("// cache.rm('foo')");
// res = cache.rm('foo');
// if (res) console.log('removed successfully');
// console.log('\n');

// console.log("// cache.keys()");
// cache.keys();
// console.log(`${cache.has('foo') ? 'foo exists' : "foo doesn't exist"}`);
// console.log('\n');

console.log("// cache.opts()");
cache1.opts();
console.log('\n');

console.log("// cache.help()");
cache1.help();
console.log('\n');

console.log("// cache.get('bar')");
res = cache2.get('bar');
if (res) console.log(res);
console.log('\n');

console.log("// cache.opts()");
cache2.opts();
console.log('\n');

console.log("// cache.clear()");
cache2.clear('long');
console.log('\n');
*/