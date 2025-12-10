const mongoose = require('mongoose');

const StandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a stand name'],
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  capacity: {
    type: Number,
    required: [true, 'Please add the stand capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  availableSpots: {
    type: Number,
    required: true
  },
  // GeoJSON Schema for Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [Longitude, Latitude]
      required: true,
      index: '2dsphere'
    }
  },
  ownerId: {
    type: String,
    required: true // Links to the Admin who created it
  },
  rates: {
    bike: { type: Number, default: 10 },
    car: { type: Number, default: 50 }
  },
  contact: {
    phone: { type: String },
    email: { type: String },
    license: { type: String }
  },
  status: {
    type: String,
    enum: ['active', 'maintenance'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Stand', StandSchema);