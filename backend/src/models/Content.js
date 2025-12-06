import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['essay', 'speech', 'tenLines', 'pageContent'],
    required: true,
  },
  slug: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  sections: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  content: {
    type: String,
    required: true,
  },
  faq: {
    type: [{
      question: String,
      answer: String,
    }],
    default: [],
  },
  meta: {
    title: String,
    description: String,
    keywords: [String],
    ogImage: String,
  },
  html: {
    type: String,
    default: '',
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

contentSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
contentSchema.index({ tenantId: 1, type: 1 });
contentSchema.index({ createdAt: -1 });

const Content = mongoose.model('Content', contentSchema);

export default Content;

