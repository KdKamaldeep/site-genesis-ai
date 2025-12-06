import mongoose from 'mongoose';

const internalLinkSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  slug: {
    type: String,
    required: true,
    index: true,
  },
  related: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

internalLinkSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const InternalLink = mongoose.model('InternalLink', internalLinkSchema);

export default InternalLink;

