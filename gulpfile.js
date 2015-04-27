var gulp = require('gulp'),
    gls = require('gulp-live-server'),
    uglify = require('gulp-uglifyjs'),
    rename = require("gulp-rename");
//___________________________________________________
gulp.task('default', ['uglify']);
//___________________________________________________
gulp.task('serve-test', function() {
    var server = gls.static("./test", 8287);
    server.start();
    //live reload changed resource(s) 
    gulp.watch(['index.js', 'test/**/*.js'], server.notify);
});
//___________________________________________________
gulp.task('uglify', function() {
    gulp.src('index.js')
        .pipe(uglify())
        .pipe(rename('decompose.min.js'))
        .pipe(gulp.dest('dist'))
});