const { createHmac, randomBytes} = require("crypto");
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

    salt:{
        type: String,
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
},
{
    timestamps: true,}
);

userSchema.pre('save', function() {
    const user = this;
    if (!user.isModified('password')) return;
    
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = createHmac('sha256', salt)
    .update(user.password)
    .digest('hex');

    this.salt = salt;   
    this.password = hashedPassword;
   
});

userSchema.static('matchPasswordAndGenerateToken', async function (email, password) { 
    const user = await this.findOne({ email });
    if (!user) throw new Error('User not found');

    const salt =  user.salt;
    const hashedPassword = user.password;

    const userProvidedHash = createHmac('sha256', salt)
    .update(password)
    .digest('hex');
    if (userProvidedHash !== hashedPassword) throw new Error('Incorrect password');
    
    const token = createTokenForUser(user);
    return token;


} );


const User = model('User', userSchema);

module.exports = User;