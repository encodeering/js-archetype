/*eslint "strict" : 0*/
'use strict';

const pkg        = require ('./package.json');

const gulp       = require ('gulp');
const cache      = require ('gulp-cached');
const eslint     = require ('gulp-eslint');
const gulpif     = require ('gulp-if');
const gutil      = require ('gulp-util');
const uglify     = require ('gulp-uglify');
const rename     = require ('gulp-rename');
const rimraf     = require ('gulp-rimraf');
const sourcemaps = require ('gulp-sourcemaps');
const mocha      = require ('gulp-spawn-mocha');

const buffer     = require ('vinyl-buffer');
const source     = require ('vinyl-source-stream');
const transform  = require ('vinyl-transform');

const browserify = require ('browserify');
const watchify   = require ('watchify');
const babelify   = require ('babelify');
const path       = require ('path');

const options    = {
    report       : Boolean (gutil.env.report),
    coverage     : Boolean (gutil.env.coverage),
    incremental  : Boolean (gutil.env.incremental),
    production   : Boolean (gutil.env.production),
    js           : {
        platform : String  (gutil.env['js-platform'] || 'node').toLowerCase (),
        language : String  (gutil.env['js-language'] ||  'es6').toLowerCase ()
    }
};

const minification = options.production && options.js.language !== 'es6';

gulp.task ('config',  () => {
    log ('js-language')  (options.js.language);
    log ('js-platform')  (options.js.platform);
    log ('coverage')     (options.coverage);
    log ('report')       (options.report);
    log ('incremental')  (options.incremental);
    log ('production')   (options.production);
    log ('minification') (minification);
});

gulp.task ('prepare', () => {
    const stream = source ('version');

           stream.end (pkg.version);
    return stream.pipe (gulp.dest ('target'));
});

gulp.task ('clean', () => {
    cache.caches = {};

    return gulp.src (['lib', 'target'], { read : false }).pipe (rimraf ());
});

gulp.task ('lint', ['prepare'], () => {
    return gulp.src (['test/**/*.spec.js', 'src/**/*.js'])
               .pipe (gulpif (options.incremental, cache ('lint')))
               .pipe (eslint ())
               .pipe (eslint.format ())
               .pipe (eslint.failOnError ());
});

gulp.task ('test', ['prepare'], () => {
    return gulp.src (['test/**/*.spec.js'], { read : false })
               .pipe (mocha  ({
                    output   : options.report   ? 'target/mocha.log' : null,
                    istanbul : options.coverage ? {
                        dir  : 'target/coverage'
                    } : false
               }).on ('error', fail ('mocha'))
    )
});

gulp.task ('package', ['lint', 'test'], () => {
    return go (true);
});

gulp.task ('watch', () => {
    gulp.watch (['test/**/*.spec.js', 'src/**/*.js'], ['lint', 'test']).on ('change',
                event => {
            if (event.type === 'deleted') {
                Object.keys (cache.caches).forEach (name => {
                    delete   cache.caches          [name][path.normalize (event.path)];
                });
            }
        }
    );

    return go (false);
});

gulp.task ('distribution', ['package'], () => {
    return gulp.src (`target/${options.js.platform}/**/*.min.js`)
               .pipe (rename (function (path) { path.basename = path.basename.replace (/\.min/, ''); }))
               .pipe (gulp.dest ('./lib'))
});

gulp.task ('default', ['package']);

/**
 * Creates a platform switch
 *
 * @param {Boolean} once specifies if we want to perform this task only once or indefintely
 * @returns {Object}
 */
function go (once) {
    switch  (options.js.platform) {
        case 'node'    : return node    (! once);
        case 'browser' : return browser (! once);
    }

    log ('platform') (`${options.js.platform} not supported`)
}

/**
 * Compiles a stream with default settings
 *
 * @param {Object} stream describes the input source
 * @returns {Object}
 */
function compile (stream) {
    const directory = `target/${options.js.platform}`;

    return stream.pipe (gulp.dest (directory))
                 .pipe (rename ({ suffix : '.min' }))
                 .pipe (sourcemaps.init ({loadMaps : true}))
                 .pipe (gulpif (minification, uglify ())).on ('error', fail ('uglify'))
                 .pipe (sourcemaps.write ('./'))
                 .pipe (gulp.dest (directory));
}

/**
 * Creates a transpiler function
 *
 * @returns {Function}
 */
function transpiler () {
    switch (options.js.language) {
        case 'es6' : return gutil.noop;
    }

    return babelify.configure ({ optional : ['runtime'] });
}

/**
 * Creates a nodified stream
 *
 * @param {Boolean} [watch] defines if a watch task shall be created additionally, default is false
 * @return {Object}
 */
function node (watch) {
    let build = () => {
        return gulp.src (['src/**/*.js'])
                   .pipe (cache ('node'))
                   .pipe (transform (transpiler ()))
    };

    if      (watch)
        gulp.watch (['src/**/*.js']).on ('change', () => compile (build ()));

    return compile (build ());
}

/**
 * Creates a browserified stream
 *
 * @param {Boolean} [watch] defines if a watch task shall be created additionally, default is false
 * @returns {Object}
 */
function browser (watch) {
    let build = (b) => {
        return   b.bundle ().on ('error', function (e) { fail ('bundling') (e); this.emit ('end'); })
                  .pipe (source ('index.js'))
                  .pipe (buffer ())
    };

    let b = browserify ('src/index.js', { debug : true }).transform (transpiler ());

    if (watch) {
        b = watchify (b);
        b.on ('log',    log ('watchify'));
        b.on ('update', () => {
            return compile (build (b)).on ('end', log ('watchify transformation finished'));
        });
    }

    return compile (build (b));
}

/**
 * Creates a logger function with a prefixed log message
 *
 * @param {String} message defines the prefix
 * @returns {Function}
 */
function log (message) {
    let c = gutil.colors;

    return function () {
        return gutil.log (c.yellow (`${message}> ${[].slice.apply (arguments).join (' ')}`));
    }
}

/**
 * Creates a logger function with a prefixed error message
 *
 * @param {String} message defines the prefix
 * @returns {Function}
 */
function fail (message) {
    let c = gutil.colors;

    return function (error) {
        if (error.fileName) {
            return gutil.log (c.red     (message)          + '> '
                            + c.red     (error.name)       + ': '
                            + c.yellow  (error.fileName)   + ': Line '
                            + c.magenta (error.lineNumber) + ' & Column '
                            + c.magenta (error.columnNumber || error.column) + ': '
                            + c.yellow  (error.description));
        } else {
            return gutil.log (c.red     (message)     + '> '
                            + c.red     (error.name)  + ': '
                            + c.yellow  (error.message));
        }
    }
}
// recipes
// https://github.com/gulpjs/gulp/blob/master/docs/recipes/handling-the-delete-event-on-watch.md
// https://gist.github.com/Fishrock123/8ea81dad3197c2f84366
