var mongoose=require('mongoose');
var BaseModel = require("./base_model");
var Schema=mongoose.Schema;
var ObjectId=mongoose.Schema.Types.ObjectId;

var CelebritySchema=new Schema({
    name: { type: String, required: true },   
    company: { type: String },                
    github: { type: String },
    home: { type: String },
    description: { type: String },
    avatar: { type: String },
    userId: { type: ObjectId, ref: 'User' },
    create_at: { type: Date, default: Date.now }
});

CelebritySchema.plugin(BaseModel);
mongoose.model('Celebrity',CelebritySchema);

