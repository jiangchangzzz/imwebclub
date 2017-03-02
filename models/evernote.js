var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var EvernoteSchema = new Schema({
    author_id: { type: ObjectId ,index: true, unique: true}, // owner
    notebooks :[
        {
            guid : String,
            name : String
        }
    ],
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now }
});

mongoose.model('Evernote', EvernoteSchema);

