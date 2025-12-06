import { useEffect, useState, ChangeEvent } from 'react'
import { contentAPI, tenantAPI } from '@/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Content, Tenant } from '@/types'

interface ContentFilters {
  tenantId: string;
  type: string;
}

export default function ContentPage() {
  const [contents, setContents] = useState<Content[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filters, setFilters] = useState<ContentFilters>({ tenantId: '', type: '' })
  const [previewOpen, setPreviewOpen] = useState<boolean>(false)
  const [previewContent, setPreviewContent] = useState<Content | null>(null)

  useEffect(() => {
    loadTenants()
    loadContent()
  }, [filters])

  const loadTenants = async (): Promise<void> => {
    try {
      const response = await tenantAPI.getAll()
      setTenants(response.data)
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const loadContent = async (): Promise<void> => {
    try {
      const params: Record<string, string> = {}
      if (filters.tenantId) params.tenantId = filters.tenantId
      if (filters.type) params.type = filters.type
      
      const response = await contentAPI.getAll(params)
      const data = response.data as any
      setContents(Array.isArray(data) ? data : (data.contents || []))
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async (id: string): Promise<void> => {
    if (!confirm('Regenerate this content?')) return
    try {
      await contentAPI.regenerate(id)
      loadContent()
      alert('Content regenerated')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to regenerate')
    }
  }

  const handlePreview = (content: Content): void => {
    setPreviewContent(content)
    setPreviewOpen(true)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">Generated Content</h1>
        <p className="text-muted-foreground">View and manage all generated content</p>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tenant</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
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
              <label className="text-sm font-medium mb-2 block">Type</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={filters.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="essay">Essay</option>
                <option value="speech">Speech</option>
                <option value="tenLines">10 Lines</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>All Content</CardTitle>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No content found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contents.map((content) => (
                    <TableRow key={content._id}>
                      <TableCell className="font-medium">{content.title}</TableCell>
                      <TableCell>{content.tenantId}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {content.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{content.slug}</TableCell>
                      <TableCell>{new Date(content.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handlePreview(content)}>
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleRegenerate(content._id)}>
                            Regenerate
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

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewContent?.title}</DialogTitle>
          </DialogHeader>
          {previewContent && (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: previewContent.html || previewContent.content }} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
