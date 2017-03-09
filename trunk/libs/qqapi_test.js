// rsync source/libs/qqapi_test.js imweb@imweb.io:/data/www/imweb.io/public/libs/
var $ = {
    send: function(url, param) {                                                
        param = param || '';
        if (typeof param === 'object') {                                        
            param.t = +new Date();                                           
            var tmp = [];                                                    
            for (var k in param) {                                           
                if (param.hasOwnProperty(k)) {                               
                    tmp.push(k + '=' + encodeURIComponent(param[k]));        
                }                                                            
            }                                                                
            param = tmp.join('&');                                           
        }                                                                    
        url = url + (url.indexOf('?') === -1 && param ? '?' : '') + param;   
        new Image().src = url;                                               
    },
    log: function(msg) {
        msg = typeof msg === 'object' ? JSON.stringify(msg) : msg;
        var param = {
            id: 97,                                                         
            uin: 100,                                                    
            from: location.href.replace(/\?.*/, ''),                         
            count: 1,
            'msg[1]': 'remote_test: ' + msg,
            'level[1]': 4
        };                                                                   
        $.send('http://badjs2.qq.com/badjs', param);
    }
};
/**
 * 依赖的mqq接口
 * mqq.sensor.getRealLocation
 * mqq.device.getNetworkType
 */
(function(){
    // utils
    var _ = {
        extend: function(obj1, obj2) {
            for (var k in obj2) {
                obj1[k] = obj2[k];
            }
            var args = [].slice.call(arguments, 1);
            if (args.length > 1) {
                args[0] = obj1;
                return this.extend.apply(this, args);
            } else {
                return obj1;
            }
        },

        clone: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        },

        useCallbacks: function(callbacks) {
            var args = [].slice.call(arguments, 1);
            for (var i in callbacks) {
                callbacks[i].apply(null, args);
            }
        },

        getStorage: function(key) {
            var str = localStorage.getItem(key) || 'null';
            try {
                return JSON.parse(str) || null;
            } catch (ex) {
                localStorage.setItem(key, '');
                return null;
            }
        },

        setStorage: function(key, obj) {
            localStorage.setItem(key, JSON.stringify(obj || null));
        }
    };

    // 上报
    var report = {
        _monitors: [],
        _monitorTick: null,
        _cleanMonitor: function() {
            var self = this;
            if (self._monitorTick) {
                clearTimeout(self._monitorTick);
            }
            if (window.Q && Q.monitor) {
                self._monitors.length && Q.monitor(self._monitors);
                self._monitors = [];
            } else {
                self._monitorTick = setTimeout(function() {
                    self._cleanMonitor();
                }, 10);
            }
        },
        monitor: function(id) {
            this._monitors.push(id);
            this._cleanMonitor();
        }
    };

    // core
    var core = {
        _getAndroidPosition: function(cb) {
            mqq.sensor.getRealLocation({
                decrypt_padding: 1 // Android新加密方式，必传
            }, function(retCode, retLat, retLng) {
                if (retCode == 0 && retLat && retLat.data) {
                    report.monitor(486794);  // android 定位成功
                    cb && cb({
                        decryptPadding: retLat.decrypt_padding || 0,
                        pos: {
                            bs: retLat.data
                        }
                    });
                } else {
                    report.monitor(485523); // android 定位失败
                    cb && cb(null);
                }
            });
        },

         _getIOSPosition: function(cb) {
            var s = +new Date();
            mqq.sensor.getRealLocation({}, function(retCode, retLat, retLng) {
                $.log(+new Date() - s);
                if (retLat && retLat.lon && retLat.lat) {
                    report.monitor(486795);  // ios 定位成功
                    cb && cb({
                        pos: {
                            lat: parseInt(retLat.lat * 1E6),
                            lng: parseInt(retLat.lon * 1E6)
                        }
                    });
                } else {
                    report.monitor(485524); // ios 定位失败
                    cb && cb(null);
                }
            });
        },

        _getGeolocation: function(cb) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var coords = position.coords;
                cb && cb({
                    pos: {
                        lat: parseInt(coords.latitude.toFixed(6) * 1E6),
                        lng: parseInt(coords.longitude.toFixed(6) * 1E6)
                    }
                });
            }, function() {
                cb && cb(null);
            });
        },

        getLocation: function(cb) {
            if (mqq.android) {
                this._getAndroidPosition(cb);
            } else if (mqq.iOS) {
                this._getIOSPosition(cb);
            } else if (navigator.geolocation) {
                this._getGeolocation(cb);
            } else {
                cb(null);
            }
        },

        getCityId: function(position, cb) {
            var data = {};
            var pos = position.pos || {};
            if (pos.lat && pos.lng) {
                data.location = {
                    latitude : pos.lat,
                    longitude: pos.lng,
                    coordinate: 0
                };
            }
            if (pos.bs) {
                data.bs = pos.bs;
            }
            var param = {
                decrypt_padding: position.decryptPadding || 0,
                data: JSON.stringify(data)
            };

            var success = function(response) {
                if (response.ec === 0) {
                    report.monitor(486793);
                    if (response.abroad === 1) {
                        report.monitor(487192); // 定位--国外城市
                    }
                    cb && cb({
                        cityId: response.cityid,
                        isAbroad: response.abroad === 1,
                        cityName: response.city,
                        pos: {
                            lat: response.lat,
                            lng: response.lng
                        }
                    });
                } else {
                    error(response);
                }
            };

            var error = function(response) {
                if (response && response.ec) {
                    report.monitor(485521); // 返回问题
                } else {
                    report.monitor(485522); // 网络问题
                }
                cb && cb(null);
            };

            var cgi = '/cgi-bin/qqactivity/get_real_cityid';

            if (window.Vinda) {
                Vinda.load('cityId', cgi, param, success, error);
            } else {
                $.NET.get({
                    url: cgi,
                    data: param,
                    success: success,
                    error: error
                });
            }
        }
    };

    // 缓存管理
    var cache = {
        KEY: 'position_cache',
        EXPIRE: 1000 * 60 * 20,
        VERSION: '1', // 控制是否强清一次缓存
        getCachedPosition: function() {
            return null;
            var stored = _.getStorage(this.KEY);
            if (!stored || +new Date() - stored._time > this.EXPIRE
                || stored._version !== this.VERSION
            ) {
                return;
            }
            return stored;
        },

        setCachedPosition: function(pos) {
            var obj = _.extend({}, pos, {
                _time: +new Date(),
                _version: this.VERSION
            });
            _.setStorage(this.KEY, obj);
        }
    };

    // 业务相关，提示出错信息
    var client = {
        positionFail: function() {
            // 如果在预加载中alert, mqq等可能还没有加载，setTimeout等等
            setTimeout(function() {
                var msg = window.mqq && mqq.iOS 
                    ? '请在设置中开启定位服务，定位更准确'
                    : '当前定位不准确，请稍后重试';
                alert(msg, 3000);
            }, 2000);
        },
        cityFail: function() {
            setTimeout(function() {
                alert('定位失败，请稍后重试', 3000);
            }, 2000);
        }
    };

    var TIMEOUT = 60000; // 定位超时时间
    var positionData = null;
    var positionCallbacks = [];
    var loadingPositionStatus = 0;
    /**
     * @param {function(Object)} cb
     *  如果获取经纬度失败cb(null)
     *  {
     *      pos: {
     *          bs: '',
     *          lat: '',
     *          lng: ''
     *      },
     *      decryptPadding: 0
     *  }
     */
    function getLocation(cb) {
        if (positionData) {
            return cb && cb(_.clone(positionData));
        }
        if (loadingPositionStatus === 2) {
            return cb && cb(null);
        }
        cb && positionCallbacks.push(cb);
        if (loadingPositionStatus === 0) {
            loadingPositionStatus = 1;
            _loadPosition();
        }
    }

    function _loadPosition() {
        var cachedPos = cache.getCachedPosition();
        var doneCount = 0;
        function done(pos, ec) {
            if (doneCount++) {
                return;
            }
            loadingPositionStatus = 2;
            if (pos) {
                // 定位成功
                // 补充默认字段
                pos.pos = pos.pos || {};
                pos.pos.lat = pos.pos.lat || 0;
                pos.pos.lng = pos.pos.lng || 0;
                pos.pos.coordinate = pos.pos.coordinate || 1;
                pos.decryptPadding = pos.decryptPadding || 0;
                // 本地保存
                positionData = pos;
                if (!cachedPos) {
                    cache.setCachedPosition(pos);
                }
                _.useCallbacks(positionCallbacks, _.clone(pos));
            } else {
                // 提示错误
                client.positionFail();
                // 定位失败
                _.useCallbacks(positionCallbacks, null);
            }
        }
        if (cachedPos) {
            report.monitor(492974);  // 使用缓存位置
            done(cachedPos);
        } else {
            report.monitor(654216);  // 获取位置
            core.getLocation(done);
        }
        setTimeout(function() {
            report.monitor(654215); 
            // 超时
            done(null, -1);
        }, TIMEOUT); 
    }

    var loadingCityIdStatus = 0;
    var cityCallbacks = [];
    /**
     * @param {function(Object)} cb
     *  如果获取经纬度失败 cb(null)
     *  如果获取城市id失败只返回经纬度信息(不含cityId字段)
     *  {
     *      pos: {
     *          bs: '',
     *          lat: '',
     *          lng: ''
     *      },
     *      decryptPadding: 0,
     *      city: '',
     *      cityId: '',
     *      isAbroad: false
     *  }
     */
    function getCityId(cb) {
        if (positionData && positionData.cityId) {
            return cb && cb(_.clone(positionData));
        }
        if (loadingCityIdStatus === 2) {
            return cb && cb(null);
        }
        cb && cityCallbacks.push(cb);
        if (loadingCityIdStatus === 0) {
            loadingCityIdStatus = 1;
            getLocation(_loadCityId);
        }
    }

    function _loadCityId(pos) {
        if (!pos) {
            return _.useCallbacks(cityCallbacks, null);
        }
        // 如果位置中已含城市
        if (pos.cityId) {
            return _.useCallbacks(cityCallbacks, pos);
        }
        // 拉cgi 获取城市id
        core.getCityId(pos, function(cityInfo) {
            if (!cityInfo) {
                // 提示错误
                client.cityFail();
                // cgi拉取失败, 此时数据中没有cityId字段
                return _.useCallbacks(cityCallbacks, positionData);
            }
            addCityInfo(cityInfo);
            _.useCallbacks(cityCallbacks, _.clone(positionData));
        });
    }

    var addCityInfo = function(cityInfo) {
        // page save
        _.extend(positionData, cityInfo, {
            pos: positionData.pos
        });
        cityInfo.pos = cityInfo.pos || {};
        _.extend(positionData.pos, {
            lng: cityInfo.pos.lng || positionData.pos.lng,
            lat: cityInfo.pos.lat || positionData.pos.lat
        });
        // cache save
        cache.setCachedPosition(positionData);
    };

    var exports = {
        getLocation: getLocation,
        getCityId: getCityId
    };

    window.Position = window.Position || exports;
    if (typeof define !== 'undefined') {
        define(function() {
            return window.Position;
        });
    }
})();

(function(){
    // utils
    var _ = {
        extend: function(obj1, obj2) {
            for (var k in obj2) {
                obj1[k] = obj2[k];
            }
            var args = [].slice.call(arguments, 1);
            if (args.length > 1) {
                args[0] = obj1;
                return this.extend.apply(this, args);
            } else {
                return obj1;
            }
        },

        clone: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        },

        useCallbacks: function(callbacks) {
            var args = [].slice.call(arguments, 1);
            for (var i in callbacks) {
                callbacks[i].apply(null, args);
            }
        },

        getStorage: function(key) {
            var str = localStorage.getItem(key) || 'null';
            try {
                return JSON.parse(str) || null;
            } catch (ex) {
                localStorage.setItem(key, '');
                return null;
            }
        },

        setStorage: function(key, obj) {
            localStorage.setItem(key, JSON.stringify(obj || null));
        }
    };

    // 上报
    var report = {
        _monitors: [],
        _monitorTick: null,
        _cleanMonitor: function() {
            var self = this;
            if (self._monitorTick) {
                clearTimeout(self._monitorTick);
            }
            if (window.Q && Q.monitor) {
                self._monitors.length && Q.monitor(self._monitors);
                self._monitors = [];
            } else {
                self._monitorTick = setTimeout(function() {
                    self._cleanMonitor();
                }, 10);
            }
        },
        monitor: function(id) {
            this._monitors.push(id);
            this._cleanMonitor();
        }
    };

    // core
    var core = {
        _getAndroidPosition: function(cb) {
            mqq.sensor.getRealLocation({
                decrypt_padding: 1 // Android新加密方式，必传
            }, function(retCode, retLat, retLng) {
                if (retCode == 0 && retLat && retLat.data) {
                    report.monitor(486794);  // android 定位成功
                    cb && cb({
                        decryptPadding: retLat.decrypt_padding || 0,
                        pos: {
                            bs: retLat.data
                        }
                    });
                } else {
                    report.monitor(485523); // android 定位失败
                    cb && cb(null);
                }
            });
        },

         _getIOSPosition: function(cb) {
            mqq.sensor.getRealLocation({}, function(retCode, retLat, retLng) {
                $.log([].slice.call(arguments));
                if (retLat && retLat.lon && retLat.lat) {
                    report.monitor(486795);  // ios 定位成功
                    cb && cb({
                        pos: {
                            lat: parseInt(retLat.lat * 1E6),
                            lng: parseInt(retLat.lon * 1E6)
                        }
                    });
                } else {
                    report.monitor(485524); // ios 定位失败
                    cb && cb(null);
                }
            });
        },

        _getGeolocation: function(cb) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var coords = position.coords;
                cb && cb({
                    pos: {
                        lat: parseInt(coords.latitude.toFixed(6) * 1E6),
                        lng: parseInt(coords.longitude.toFixed(6) * 1E6)
                    }
                });
            }, function() {
                cb && cb(null);
            }, {
                timeout: 15000, // 定位超时时间
                maximumAge: 15000
            });
        },

        getLocation: function(cb) {
            if (mqq.android) {
                this._getAndroidPosition(cb);
            } else if (mqq.iOS) {
                this._getIOSPosition(cb);
            } else if (navigator.geolocation) {
                this._getGeolocation(cb);
            } else {
                cb(null);
            }
        },

        getCityId: function(position, cb) {
            var data = {};
            var pos = position.pos || {};
            if (pos.lat && pos.lng) {
                data.location = {
                    latitude : pos.lat,
                    longitude: pos.lng,
                    coordinate: 0
                };
            }
            if (pos.bs) {
                data.bs = pos.bs;
            }
            var param = {
                decrypt_padding: position.decryptPadding || 0,
                data: JSON.stringify(data)
            };

            var success = function(response) {
                if (response.ec === 0) {
                    report.monitor(486793);
                    if (response.abroad === 1) {
                        report.monitor(487192); // 定位--国外城市
                    }
                    cb && cb({
                        cityId: response.cityid,
                        isAbroad: response.abroad === 1,
                        cityName: response.city,
                        pos: {
                            lat: response.lat,
                            lng: response.lng
                        }
                    });
                } else {
                    error(response);
                }
            };

            var error = function(response) {
                if (response && response.ec) {
                    report.monitor(485521); // 返回问题
                } else {
                    report.monitor(485522); // 网络问题
                }
                cb && cb(null);
            };

            var cgi = '/cgi-bin/qqactivity/get_real_cityid';

            if (window.Vinda) {
                Vinda.load('cityId', cgi, param, success, error);
            } else {
                $.NET.get({
                    url: cgi,
                    data: param,
                    success: success,
                    error: error
                });
            }
        }
    };

    // 缓存管理
    var cache = {
        KEY: 'position_cache',
        EXPIRE: 1000 * 60 * 20,
        VERSION: '1', // 控制是否强清一次缓存
        getCachedPosition: function() {
            return null;
            var stored = _.getStorage(this.KEY);
            if (!stored || +new Date() - stored._time > this.EXPIRE
                || stored._version !== this.VERSION
            ) {
                return;
            }
            return stored;
        },

        setCachedPosition: function(pos) {
            var obj = _.extend({}, pos, {
                _time: +new Date(),
                _version: this.VERSION
            });
            _.setStorage(this.KEY, obj);
        }
    };

    // 业务相关，提示出错信息
    var client = {
        positionFail: function() {
            // 如果在预加载中alert, mqq等可能还没有加载，setTimeout等等
            setTimeout(function() {
                var msg = window.mqq && mqq.iOS 
                    ? '请在设置中开启定位服务，定位更准确'
                    : '当前定位不准确，请稍后重试';
                alert(msg, 3000);
            }, 2000);
        },
        cityFail: function() {
            setTimeout(function() {
                alert('定位失败，请稍后重试', 3000);
            }, 2000);
        }
    };

    var positionData = null;
    var positionCallbacks = [];
    var loadingPositionStatus = 0;
    /**
     * @param {function(Object)} cb
     *  如果获取经纬度失败cb(null)
     *  {
     *      pos: {
     *          bs: '',
     *          lat: '',
     *          lng: ''
     *      },
     *      decryptPadding: 0
     *  }
     */
    function getLocation(cb) {
        if (positionData) {
            return cb && cb(_.clone(positionData));
        }
        if (loadingPositionStatus === 2) {
            return cb && cb(null);
        }
        cb && positionCallbacks.push(cb);
        if (loadingPositionStatus === 0) {
            loadingPositionStatus = 1;
            _loadPosition();
        }
    }

    function _loadPosition() {
        var cachedPos = cache.getCachedPosition();
        var doneCount = 0;
        $.log('load');
        function done(pos, ec) {
            if (doneCount++) {
                return;
            }
            loadingPositionStatus = 2;
            if (pos) {
                // 定位成功
                // 补充默认字段
                pos.pos = pos.pos || {};
                pos.pos.lat = pos.pos.lat || 0;
                pos.pos.lng = pos.pos.lng || 0;
                pos.pos.coordinate = pos.pos.coordinate || 1;
                pos.decryptPadding = pos.decryptPadding || 0;
                // 本地保存
                positionData = pos;
                if (!cachedPos) {
                    cache.setCachedPosition(pos);
                }
                _.useCallbacks(positionCallbacks, _.clone(pos));
            } else {
                // 提示错误
                client.positionFail();
                // 定位失败
                _.useCallbacks(positionCallbacks, null);
            }
        }
        if (cachedPos) {
            report.monitor(492974);  // 使用缓存位置
            done(cachedPos);
        } else {
            report.monitor(654216);  // 获取位置
            core.getLocation(done);
        }
        setTimeout(function() {
            // 超时
            done(null, -1);
        }, 15000); 
    }

    var loadingCityIdStatus = 0;
    var cityCallbacks = [];
    /**
     * @param {function(Object)} cb
     *  如果获取经纬度失败 cb(null)
     *  如果获取城市id失败只返回经纬度信息(不含cityId字段)
     *  {
     *      pos: {
     *          bs: '',
     *          lat: '',
     *          lng: ''
     *      },
     *      decryptPadding: 0,
     *      city: '',
     *      cityId: '',
     *      isAbroad: false
     *  }
     */
    function getCityId(cb) {
        if (positionData && positionData.cityId) {
            return cb && cb(_.clone(positionData));
        }
        if (loadingCityIdStatus === 2) {
            return cb && cb(null);
        }
        cb && cityCallbacks.push(cb);
        if (loadingCityIdStatus === 0) {
            loadingCityIdStatus = 1;
            getLocation(_loadCityId);
        }
    }

    function _loadCityId(pos) {
        if (!pos) {
            return _.useCallbacks(cityCallbacks, null);
        }
        // 如果位置中已含城市
        if (pos.cityId) {
            return _.useCallbacks(cityCallbacks, pos);
        }
        // 拉cgi 获取城市id
        core.getCityId(pos, function(cityInfo) {
            if (!cityInfo) {
                // 提示错误
                client.cityFail();
                // cgi拉取失败, 此时数据中没有cityId字段
                return _.useCallbacks(cityCallbacks, positionData);
            }
            addCityInfo(cityInfo);
            _.useCallbacks(cityCallbacks, _.clone(positionData));
        });
    }

    var addCityInfo = function(cityInfo) {
        // page save
        _.extend(positionData, cityInfo, {
            pos: positionData.pos
        });
        cityInfo.pos = cityInfo.pos || {};
        _.extend(positionData.pos, {
            lng: cityInfo.pos.lng || positionData.pos.lng,
            lat: cityInfo.pos.lat || positionData.pos.lat
        });
        // cache save
        cache.setCachedPosition(positionData);
    };

    var exports = {
        getLocation: getLocation,
        getCityId: getCityId
    };

    window.Position = window.Position || exports;
    if (typeof define !== 'undefined') {
        define(function() {
            return window.Position;
        });
    }
})();

Position.getLocation(function(data) {
    $.log(data);
});

