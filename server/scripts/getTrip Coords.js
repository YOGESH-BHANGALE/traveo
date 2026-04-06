const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const User = require('../models/User');

const getCoords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const trip = await Trip.findOne({ status: 'open' }).populate('user', 'name role');
    console.log('Recent open trip:');
    console.log('Posted by:', trip.user.name, '(' + trip.user.role + ')');
    console.log('Source:', trip.source.landmark || trip.source.address);
    console.log('Coordinates:', trip.source.lat, ',', trip.source.lng);
    console.log('\nTo see this trip, rider must be within 1.5km of these coordinates');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

getCoords();
