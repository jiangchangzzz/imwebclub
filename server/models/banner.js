var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var BannerSchema = new Schema({
    image: {type: String},
    link: {type: String},
    background: {type: String, default: '#fff'},
    index: { type: Number, default: -1 },
    status: {type: Number, default: 1}
});

BannerSchema.index({index: 1});

mongoose.model('Banner', BannerSchema);
