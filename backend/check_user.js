const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'customer@walmart.com' }).select('+password');
        if (user) {
            console.log('User found:', user.email);
            console.log('Password Hash:', user.password);
        } else {
            console.log('User NOT found');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
