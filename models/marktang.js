var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var MarktangSchema = new Schema({
    author_id: { type: ObjectId ,index: true}, // owner
    noteid : { type: String}, //notebook guid
    guid : { type: String}, //evernote guid
    title : { type: String},
    content : { type: String},
    html : { type: String},
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now }
});

mongoose.model('Marktang', MarktangSchema);

