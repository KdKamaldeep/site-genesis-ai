import mongoose from 'mongoose';

const keywordSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  keyword: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['essay', 'speech', 'tenLines', 'pageContent'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed', 'failed_permanent'],
    default: 'pending',
    index: true,
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  error: {
    type: String,
    default: null,
  },
  aiProvider: {
    type: String,
    enum: ['openai', 'gemini', null],
    default: null,
  },
  slug: {
    type: String,
    required: true,
    index: true,
  },
  customPrompt: {
    type: String,
    default: null,
    trim: true,
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

keywordSchema.index({ tenantId: 1, status: 1 });
keywordSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
keywordSchema.index({ tenantId: 1, status: 1, retryCount: 1 });

const Keyword = mongoose.model('Keyword', keywordSchema);

export default Keyword;

