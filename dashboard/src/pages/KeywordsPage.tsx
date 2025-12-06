import { useEffect, useState, ChangeEvent } from 'react'
import { keywordAPI, tenantAPI } from '@/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Filter, CheckCircle, Clock, XCircle, Loader, RotateCw, Edit } from 'lucide-react'
// @ts-ignore - papaparse doesn't have types
import Papa from 'papaparse'
import type { Keyword, Tenant } from '@/types'

interface KeywordFilters {
  tenantId: string;
  status: string;
  type: string;
}

interface KeywordFormData {
  tenantId: string;
  keyword: string;
  type: 'essay' | 'speech' | 'tenLines' | 'pageContent';
  slug?: string;
  customPrompt?: string;
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false)
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null)
  const [bulkDialogOpen, setBulkDialogOpen] = useState<boolean>(false)
  const [filters, setFilters] = useState<KeywordFilters>({ tenantId: '', status: '', type: '' })
  const [formData, setFormData] = useState<KeywordFormData>({
    tenantId: '',
    keyword: '',
    type: 'essay',
    slug: '',
    customPrompt: '',
  })
  const [bulkKeywords, setBulkKeywords] = useState<string>('')
  const [retryingKeywords, setRetryingKeywords] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTenants()
    loadKeywords()
  }, [filters])

  const loadTenants = async (): Promise<void> => {
    try {
      const response = await tenantAPI.getAll()
      setTenants(response.data)
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const loadKeywords = async (): Promise<void> => {
    try {
      const params: Record<string, string> = {}
      if (filters.tenantId) params.tenantId = filters.tenantId
      if (filters.status) params.status = filters.status
      if (filters.type) params.type = filters.type
      
      const response = await keywordAPI.getAll(params)
      const data = response.data as any
      setKeywords(Array.isArray(data) ? data : (data.keywords || []))
    } catch (error) {
      console.error('Error loading keywords:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (): Promise<void> => {
    try {
      const payload: any = {
        tenantId: formData.tenantId,
        keyword: formData.keyword,
        type: formData.type,
      }
      if (formData.slug && formData.slug.trim()) {
        payload.slug = formData.slug.trim()
      }
      if (formData.customPrompt && formData.customPrompt.trim()) {
        payload.customPrompt = formData.customPrompt.trim()
      }
      await keywordAPI.create(payload)
      setDialogOpen(false)
      setFormData({ tenantId: '', keyword: '', type: 'essay', slug: '', customPrompt: '' })
      loadKeywords()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create keyword')
    }
  }

  const handleBulkCreate = async (): Promise<void> => {
    try {
      const lines = bulkKeywords.split('\n').filter(line => line.trim())
      const keywordsArray = lines.map(line => line.trim())
      
      await keywordAPI.bulkCreate({
        tenantId: formData.tenantId,
        keywords: keywordsArray,
        type: formData.type,
      })
      
      setBulkDialogOpen(false)
      setBulkKeywords('')
      loadKeywords()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to bulk create keywords')
    }
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      Papa.parse(file, {
        complete: (results: any) => {
          const keywords = results.data.flat().filter((k: any) => k && k.trim())
          setBulkKeywords(keywords.join('\n'))
        },
        header: false,
      })
    }
  }

  const handleRetryKeyword = async (keywordId: string): Promise<void> => {
    if (retryingKeywords.has(keywordId)) return
    
    if (!confirm('Retry generating content for this keyword?')) return
    
    try {
      setRetryingKeywords(prev => new Set(prev).add(keywordId))
      await keywordAPI.retry(keywordId)
      alert('Content generation started. The keyword status will update shortly.')
      await loadKeywords()
    } catch (error: any) {
      console.error('Error retrying keyword:', error)
      alert(error.response?.data?.error || error.message || 'Failed to retry keyword')
    } finally {
      setRetryingKeywords(prev => {
        const newSet = new Set(prev)
        newSet.delete(keywordId)
        return newSet
      })
    }
  }

  const handleEdit = (keyword: Keyword): void => {
    setEditingKeyword(keyword)
    setFormData({
      tenantId: keyword.tenantId,
      keyword: keyword.keyword,
      type: keyword.type,
      slug: keyword.slug,
      customPrompt: (keyword as any).customPrompt || '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (): Promise<void> => {
    if (!editingKeyword) return

    try {
      const payload: any = {
        keyword: formData.keyword,
        type: formData.type,
      }
      if (formData.slug && formData.slug.trim() && formData.slug !== editingKeyword.slug) {
        payload.slug = formData.slug.trim()
      }
      if (formData.customPrompt !== undefined) {
        payload.customPrompt = formData.customPrompt.trim() || null
      }
      await keywordAPI.update(editingKeyword._id, payload)
      setEditDialogOpen(false)
      setEditingKeyword(null)
      setFormData({ tenantId: '', keyword: '', type: 'essay', slug: '', customPrompt: '' })
      loadKeywords()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update keyword')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Keywords</h1>
          <p className="text-muted-foreground">Manage keywords for content generation</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setBulkDialogOpen(true)}
            variant="outline"
            className="border-2 hover:bg-purple-50 hover:border-purple-300"
          >
            Bulk Import
          </Button>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="gradient-primary text-white shadow-lg hover:shadow-xl"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Add Keyword
          </Button>
        </div>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Tenant</Label>
              <select
                className="w-full h-11 rounded-lg border-2 border-input bg-background px-4 focus:border-blue-500 transition-colors"
                value={filters.tenantId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, tenantId: e.target.value })}
              >
                <option value="">All Tenants</option>
                {tenants.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Status</Label>
              <select
                className="w-full h-11 rounded-lg border-2 border-input bg-background px-4 focus:border-blue-500 transition-colors"
                value={filters.status}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, status: e.target.value })}
              >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="generating">Generating</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="failed_permanent">Failed (Permanent)</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Type</Label>
              <select
                className="w-full h-11 rounded-lg border-2 border-input bg-background px-4 focus:border-blue-500 transition-colors"
                value={filters.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="essay">Essay</option>
                <option value="speech">Speech</option>
                <option value="tenLines">10 Lines</option>
                <option value="pageContent">Page Content</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>All Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          {keywords.length === 0 ? (
            <div className="text-center py-12">
              <KeyRound className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No keywords found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Keyword</TableHead>
                    <TableHead className="font-semibold">Tenant</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">AI Provider</TableHead>
                    <TableHead className="font-semibold">Retries</TableHead>
                    <TableHead className="font-semibold">Error</TableHead>
                    <TableHead className="font-semibold">Slug</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((keyword) => (
                    <TableRow key={keyword._id} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>{keyword.tenantId}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {keyword.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          keyword.status === 'completed' ? 'bg-green-100 text-green-700' :
                          keyword.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          keyword.status === 'generating' ? 'bg-blue-100 text-blue-700' :
                          keyword.status === 'failed_permanent' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {keyword.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {keyword.status === 'pending' && <Clock className="w-3 h-3" />}
                          {keyword.status === 'generating' && <Loader className="w-3 h-3 animate-spin" />}
                          {(keyword.status === 'failed' || keyword.status === 'failed_permanent') && <XCircle className="w-3 h-3" />}
                          {keyword.status === 'failed_permanent' ? 'failed (permanent)' : keyword.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {keyword.aiProvider ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            keyword.aiProvider === 'openai' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {keyword.aiProvider === 'openai' ? 'OpenAI' : 'Gemini'}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.retryCount !== undefined && keyword.retryCount > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {keyword.retryCount}/2
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.error ? (
                          <span 
                            className="text-xs text-red-600 cursor-help" 
                            title={keyword.error}
                          >
                            {keyword.error.length > 50 ? `${keyword.error.substring(0, 50)}...` : keyword.error}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{keyword.slug}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(keyword)}
                            className="h-8 px-3 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryKeyword(keyword._id)}
                            disabled={retryingKeywords.has(keyword._id) || keyword.status === 'generating'}
                            className="h-8 px-3 text-xs"
                          >
                            {retryingKeywords.has(keyword._id) ? (
                              <>
                                <Loader className="w-3 h-3 mr-1 animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RotateCw className="w-3 h-3 mr-1" />
                                Retry
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Keyword</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tenant</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={formData.tenantId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, tenantId: e.target.value })}
              >
                <option value="">Select Tenant</option>
                {tenants.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Keyword</Label>
              <Input
                value={formData.keyword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, keyword: e.target.value })}
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={formData.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value as 'essay' | 'speech' | 'tenLines' })}
              >
                <option value="essay">Essay</option>
                <option value="speech">Speech</option>
                <option value="tenLines">10 Lines</option>
                <option value="pageContent">Page Content</option>
              </select>
            </div>
            <div>
              <Label>Custom Slug (Optional)</Label>
              <Input
                placeholder="Auto-generated from keyword if left empty"
                value={formData.slug || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-generate from keyword</p>
            </div>
            <div>
              <Label>Custom AI Prompt {formData.type === 'pageContent' ? '(Required)' : '(Optional)'}</Label>
              <textarea
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={formData.type === 'pageContent' ? 'Enter custom instructions for AI. This is required for Page Content type.' : 'Enter custom instructions for AI. This will be combined with the system prompt.'}
                value={formData.customPrompt || ''}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, customPrompt: e.target.value })}
                required={formData.type === 'pageContent'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.type === 'pageContent' 
                  ? 'This prompt is required for Page Content type and will be combined with the system prompt.'
                  : 'This prompt will be combined with the system prompt for content generation'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Keyword</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Keyword</Label>
              <Input
                value={formData.keyword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, keyword: e.target.value })}
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={formData.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value as 'essay' | 'speech' | 'tenLines' })}
              >
                <option value="essay">Essay</option>
                <option value="speech">Speech</option>
                <option value="tenLines">10 Lines</option>
                <option value="pageContent">Page Content</option>
              </select>
            </div>
            <div>
              <Label>Custom Slug (Optional)</Label>
              <Input
                placeholder="Auto-generated from keyword if left empty"
                value={formData.slug || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-generate from keyword</p>
            </div>
            <div>
              <Label>Custom AI Prompt {formData.type === 'pageContent' ? '(Required)' : '(Optional)'}</Label>
              <textarea
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={formData.type === 'pageContent' ? 'Enter custom instructions for AI. This is required for Page Content type.' : 'Enter custom instructions for AI. This will be combined with the system prompt.'}
                value={formData.customPrompt || ''}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, customPrompt: e.target.value })}
                required={formData.type === 'pageContent'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.type === 'pageContent' 
                  ? 'This prompt is required for Page Content type and will be combined with the system prompt.'
                  : 'This prompt will be combined with the system prompt for content generation'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false)
              setEditingKeyword(null)
              setFormData({ tenantId: '', keyword: '', type: 'essay', slug: '', customPrompt: '' })
            }}>Cancel</Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import Keywords</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tenant</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={formData.tenantId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, tenantId: e.target.value })}
              >
                <option value="">Select Tenant</option>
                {tenants.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={formData.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value as 'essay' | 'speech' | 'tenLines' })}
              >
                <option value="essay">Essay</option>
                <option value="speech">Speech</option>
                <option value="tenLines">10 Lines</option>
                <option value="pageContent">Page Content</option>
              </select>
            </div>
            <div>
              <Label>Keywords (one per line or CSV file)</Label>
              <Input type="file" accept=".csv" onChange={handleFileUpload} />
              <textarea
                className="w-full h-40 mt-2 rounded-md border border-input bg-background px-3 py-2"
                value={bulkKeywords}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBulkKeywords(e.target.value)}
                placeholder="Enter keywords, one per line"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkCreate}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
