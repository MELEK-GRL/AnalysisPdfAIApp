// src/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        termsAcceptedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);



module.exports = mongoose.model('User', userSchema);
