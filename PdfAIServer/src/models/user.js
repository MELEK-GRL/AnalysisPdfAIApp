// src/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true, // sadece burada unique tanımlı
        },
        email: {
            type: String,
            required: true,
            unique: true, // burada da unique tanımlı
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
    },
    { timestamps: true }
);



module.exports = mongoose.model('User', userSchema);
