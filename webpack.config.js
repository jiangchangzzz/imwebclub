'use strict';
var path = require('path');
var glob = require('glob');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
// var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

var debug = process.env.NODE_ENV !== 'production';

debug=false;

var entries = getEntry('trunk/entry/**/*.js', 'trunk/entry/');

// var chunks = Object.keys(entries);
var config = {
    entry: entries,
    output: {
        path: path.join(__dirname, 'public'),
        publicPath: '/public/',
        filename: 'javascripts/[name].js',
        chunkFilename: 'javascripts/[id].chunk.js?[chunkhash]'
    },
    module: {
        loaders: [ //加载器
            {
                test: /\.js?$/,
                loaders: ['babel-loader?presets[]=es2015'],
                // 只命中src目录里的js文件，加快webpack搜索速度
                include: path.resolve(__dirname, 'trunk'),
                exclude: [/node_modules/, /webuploader.withoutimage.min/],
            }, {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style', 'css')
            }, {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('css!less')
            }, {
                test: /\.html$/,
                loader: "html?-minimize" //避免压缩html,https://github.com/webpack/html-loader/issues/50
            }, {
                test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader?name=fonts/[name].[ext]'
            }, {
                test: /\.(png|jpe?g|gif)$/,
                loader: 'url-loader?limit=8192&name=images/[name]-[hash].[ext]'
            }
        ]
    },
    plugins: [
        // new webpack.ProvidePlugin({ //加载jq
        // 	$: 'jquery'
        // }),
        // new CommonsChunkPlugin({
        //     name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
        //     chunks: chunks,
        //     minChunks: 2 // 提取所有entry共同依赖的模块
        // }),
        new ExtractTextPlugin('stylesheets/[name].css'), //单独使用link标签加载css并设置路径，相对于output配置中的publickPath
        debug ? function () { } : new UglifyJsPlugin({ //压缩代码
            compress: {
                warnings: false
            },
            except: ['$super', '$', 'exports', 'require'] //排除关键字
        })
    ]
};

var pages = Object.keys(getEntry('trunk/views/**/*.html', 'trunk/views/'));
pages.forEach(function (pathname) {
    var conf = {
        filename: '../views/' + pathname + '.html', //生成的html存放路径，相对于path
        template: 'trunk/views/' + pathname + '.html', //html模板路径
        inject: false, //js插入的位置，true/'head'/'body'/false
        // minify: { //压缩HTML文件
        // 	removeComments: true, //移除HTML中的注释
        // 	collapseWhitespace: false //删除空白符与换行符
        // }
    };
    if (pathname in config.entry) {
        conf.favicon = path.resolve(__dirname, 'trunk/images/icon.png');
        conf.inject = 'body';
        conf.chunks = ['vendors', pathname];
        conf.hash = true;
    }
    config.plugins.push(new HtmlWebpackPlugin(conf));
});

function getEntry(globPath, pathDir) {
    var files = glob.sync(globPath);
    var entries = {},
        entry, dirname, basename, pathname, extname;

    for (var i = 0; i < files.length; i++) {
        entry = files[i];
        dirname = path.dirname(entry);
        extname = path.extname(entry);
        basename = path.basename(entry, extname);
        pathname = path.normalize(path.join(dirname, basename));
        pathDir = path.normalize(pathDir);
        if (pathname.startsWith(pathDir)) {
            pathname = pathname.substring(pathDir.length)
        }
        entries[pathname] = ['./' + entry];
    }
    return entries;
}

module.exports = config;
