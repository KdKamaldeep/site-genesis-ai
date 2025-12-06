import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  domain: {
    type: String,
    required: true,
    trim: true,
  },
  logoUrl: {
    type: String,
    default: '',
  },
  adsenseCode: {
    type: String,
    default: '',
  },
  theme: {
    primary: {
      type: String,
      default: '#3b82f6',
    },
    mode: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
  },
  cronFrequency: {
    type: Number,
    default: 5, // posts per day
    min: 1,
    max: 50,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;

