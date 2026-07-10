const bcrypt = require('bcrypt');
const { Schema, model } = require('mongoose');
const { createTokenForUser } = require('../services/auth');

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },
    
    profileImageURL: {
        type: String,
        default: '/images/user_avatar.png',
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    bio: {
        type: String,
        default: '',
    },
    twitterURL: {
        type: String,
        default: '',
    },
    githubURL: {
        type: String,
        default: '',
    },
    websiteURL: {
        type: String,
        default: '',
    },
},
{
    timestamps: true,
});

userSchema.pre('save', async function() {
    const user = this;
    if (!user.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

userSchema.static('matchPasswordAndGenerateToken', async function (email, password) { 
    const user = await this.findOne({ email });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Incorrect password');
    
    const token = createTokenForUser(user);
    return token;
});


const User = model('User', userSchema);

module.exports = User;