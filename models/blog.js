const { Schema, model } = require('mongoose');

const blogSchema = new Schema({
    title: {
        type:String,
        required: true,
    },
    body:{
        type: String, 
        required: true,
    },
    coverImageURL: {
        type: String,
        required: false,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",  
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },
    category: {
        type: String,
        required: false
    },
    tags: {
        type: [String],
        default: []
    },
    views: {
        type: Number,
        default: 0
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    fontFamily: {
        type: String,
        default: 'Inter'
    },
    fontUrl: {
        type: String,
        required: false
    },
    fontSize: {
        type: String,
        default: 'medium'
    },
    lineHeight: {
        type: String,
        default: 'relaxed'
    },
    fontColor: {
        type: String,
        default: '#334155'
    }
},
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

blogSchema.virtual('readingTime').get(function() {
    if (!this.body) return 1;
    const wordCount = this.body.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
});

const Blog = model("blog", blogSchema);

module.exports = Blog;