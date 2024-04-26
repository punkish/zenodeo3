# zlogger
*a realy zimple logger*

There are a lot of wonderful loggers that do a lot of things. This is not one of them. This is a zero-dependency, 3.9KB (135 lines), synchronous logger, basically just a wrapper around `process.stdout.write`. It has loglevels and transports and can output log in color.

1. import the logger class. If your script is in a CommonJS format, rename it with `.mjs` extension.
    ```js
    import { Zlogger } from '@punkish/zlogger';
    ```

2. create a new logger with options
    ```js
    const log = new Zlogger({

        // every log line gets decorated with the name.
        // there is no default value
        name: 'MAIN', 

        // log levels can be
        //  'debug', 'info', 'warn', 'error', 'fatal'
        //  'info' is the default log level
        level: 'info', 

        // transports are where the log is written
        //   'console' always exists in development
        //   'file' is optional
        transports: [ 'console', 'file' ],

        // 'mode' is optional and chooses between streams and appendFile,
        // defaulting to streams if none is provided
        mode: 'streams',

        // 'dir' is optional and used when transport is 'file'
        // if no 'dir' is provided then 'logs' is used
        dir: 'path/to/logdir'
    });
    ```

3. log away
    ```js
    log.info(`logger level is ${log.level()}`);
    log.info('foo');
    log.info('hello… ', 'start');
    log.info('done\n', 'end');
    log.warn('oops');
    log.error('uh oh!');
    log.fatal('died');
    ```
    The optional 'start' and 'end' position flags output the log message on the same line (in this case, you have to add the `\n` newline explicitly when the 'pos' is 'end'). In the example shown above, the output will be
    ```log
    2022-02-28 20:09:15.240 MAIN – INFO  logger level is FATAL
    2022-02-28 20:09:15.240 MAIN — INFO  foo
    2022-02-28 20:09:15.240 MAIN — INFO  hello… done
    2022-02-28 20:09:15.241 MAIN — WARN  oops
    2022-02-28 20:09:15.241 MAIN — ERROR uh oh!
    2022-02-28 20:09:15.242 MAIN — FATAL died
    ```
