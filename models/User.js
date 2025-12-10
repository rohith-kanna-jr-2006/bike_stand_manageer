const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    authProvider: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    salt: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String
    },
    googleId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    vehicleNumber: {
        type: String
    },
    vehicleType: {
        type: String,
        enum: ['two-wheeler', 'car']
    },
    vehicleModel: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    address: {
        type: String
    },
    paymentMethods: {
        type: Array,
        default: []
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorMethod: {
        type: String,
        enum: ['app', 'sms']
    }
});

module.exports = mongoose.model('User', UserSchema);
