import { useEffect, useState, ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tenantAPI, cronAPI } from '@/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Tenant } from '@/types'

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [formData, setFormData] = useState<Partial<Tenant>>({})
  const [generating, setGenerating] = useState<boolean>(false)

  useEffect(() => {
    if (id) {
      loadTenant()
    }
  }, [id])

  const loadTenant = async (): Promise<void> => {
    if (!id) return
    try {
      const response = await tenantAPI.getById(id)
      setTenant(response.data)
      setFormData(response.data)
    } catch (error) {
      console.error('Error loading tenant:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (): Promise<void> => {
    if (!id) return
    try {
      await tenantAPI.update(id, formData)
      alert('Tenant updated successfully')
      loadTenant()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update tenant')
    }
  }

  const handleGenerate = async (): Promise<void> => {
    if (!id) return
    setGenerating(true)
    try {
      await cronAPI.run(id)
      alert('Content generation started')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate content')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!tenant) return <div>Tenant not found</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Edit Tenant: {tenant.name}</h1>
          <p className="text-muted-foreground">Manage tenant settings and configuration</p>
        </div>
        <Button onClick={() => navigate('/tenants')} variant="outline">
          Back to Tenants
        </Button>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Tenant Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Name</Label>
            <Input
              value={formData.name || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Domain</Label>
            <Input
              value={formData.domain || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, domain: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Logo URL</Label>
            <Input
              value={formData.logoUrl || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">AdSense Code</Label>
            <Input
              value={formData.adsenseCode || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, adsenseCode: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Posts per Day</Label>
            <Input
              type="number"
              value={formData.cronFrequency || 5}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, cronFrequency: parseInt(e.target.value) })}
              min="1"
              max="50"
              className="h-11"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdate} className="gradient-primary text-white">
              Save Changes
            </Button>
            <Button onClick={handleGenerate} disabled={generating} variant="outline">
              {generating ? 'Generating...' : 'Generate Content Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
