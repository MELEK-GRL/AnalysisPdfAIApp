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
            // Uzunluk kontrolü plaintext üzerinde auth route’ta (hash ~60 karakter)
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
