import { useEffect, useState, ChangeEvent } from 'react'
import { templateAPI, tenantAPI } from '@/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Tenant } from '@/types'

export default function TemplatesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [template, setTemplate] = useState<string>('')
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    loadTenants()
  }, [])

  useEffect(() => {
    if (selectedTenant) {
      loadTemplate()
    }
  }, [selectedTenant])

  const loadTenants = async (): Promise<void> => {
    try {
      const response = await tenantAPI.getAll()
      setTenants(response.data)
      if (response.data.length > 0) {
        setSelectedTenant(response.data[0]._id)
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const loadTemplate = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await templateAPI.get(selectedTenant)
      setTemplate(response.data.template)
    } catch (error) {
      console.error('Error loading template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (): Promise<void> => {
    try {
      await templateAPI.update(selectedTenant, template)
      alert('Template saved successfully')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save template')
    }
  }

  const handlePreview = async (): Promise<void> => {
    try {
      const response = await templateAPI.preview(selectedTenant, template)
      setPreview(response.data.html)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to preview template')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">Templates</h1>
        <p className="text-muted-foreground">Edit EJS templates for each tenant</p>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Edit Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Tenant</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 mt-2"
              value={selectedTenant}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedTenant(e.target.value)}
            >
              {tenants.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>EJS Template</Label>
            <textarea
              className="w-full h-96 font-mono text-sm rounded-md border border-input bg-background px-3 py-2 mt-2"
              value={template}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTemplate(e.target.value)}
              placeholder="Enter EJS template code..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save Template</Button>
            <Button variant="outline" onClick={handlePreview}>Preview</Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4">
              <iframe
                srcDoc={preview}
                className="w-full h-96 border-0"
                title="Template Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
