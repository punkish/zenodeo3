function syncFn(i) {
    // Do something synchronous

    // Write progress to stdout
    if (!(i % 1)) {
        process.stdout.write(`${i % 5 ? '.' : '*'}`);
    }
}

function asyncFn() {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), 50);
    });
}

async function main() {
    console.log('start main');

    for (let i = 0; i < 50; i++) {
        await asyncFn();
        syncFn(i);
    }

    console.log('\nend main');
}

main();