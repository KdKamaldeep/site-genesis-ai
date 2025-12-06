import { useEffect, useState, ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { tenantAPI } from '@/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Plus, Globe, Calendar, Edit, Trash2, Sparkles } from 'lucide-react'
import type { Tenant } from '@/types'

interface TenantFormData {
  _id: string;
  name: string;
  domain: string;
  logoUrl: string;
  adsenseCode: string;
  cronFrequency: number;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [formData, setFormData] = useState<TenantFormData>({
    _id: '',
    name: '',
    domain: '',
    logoUrl: '',
    adsenseCode: '',
    cronFrequency: 5,
  })

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async (): Promise<void> => {
    try {
      const response = await tenantAPI.getAll()
      setTenants(response.data)
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (): Promise<void> => {
    try {
      await tenantAPI.create(formData)
      setDialogOpen(false)
      setFormData({
        _id: '',
        name: '',
        domain: '',
        logoUrl: '',
        adsenseCode: '',
        cronFrequency: 5,
      })
      loadTenants()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create tenant')
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this tenant?')) return
    try {
      await tenantAPI.delete(id)
      loadTenants()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete tenant')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Tenants</h1>
          <p className="text-muted-foreground">Manage your multi-tenant sites</p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)}
          className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6 py-6 text-base font-semibold"
        >
          <Users className="w-5 h-5 mr-2" />
          Create Tenant
        </Button>
      </div>

      {tenants.length === 0 ? (
        <Card className="glass-effect card-hover">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Tenants Yet</h3>
            <p className="text-muted-foreground mb-6 text-center">Get started by creating your first tenant</p>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="gradient-primary text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Tenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <Card key={tenant._id} className="glass-effect card-hover group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/tenants/${tenant._id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(tenant._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl mt-4 group-hover:text-blue-600 transition-colors">
                  {tenant.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Globe className="w-4 h-4" />
                  <span>{tenant.domain}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Posts/Day</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{tenant.cronFrequency}</span>
                </div>
                <Link to={`/tenants/${tenant._id}`}>
                  <Button variant="outline" className="w-full mt-4 hover:bg-blue-50 hover:border-blue-300">
                    Manage Tenant
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Create New Tenant</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">Set up a new tenant for content generation</p>
          </DialogHeader>
          <div className="space-y-5 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Tenant ID *</Label>
                <Input
                  value={formData._id}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, _id: e.target.value })}
                  placeholder="site1"
                  className="h-11 border-2 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Posts per Day *</Label>
                <Input
                  type="number"
                  value={formData.cronFrequency}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, cronFrequency: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                  className="h-11 border-2 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome Site"
                className="h-11 border-2 focus:border-blue-500"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Domain *</Label>
              <Input
                value={formData.domain}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.com"
                className="h-11 border-2 focus:border-blue-500"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Logo URL</Label>
              <Input
                value={formData.logoUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="h-11 border-2 focus:border-blue-500"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">AdSense Code</Label>
              <Input
                value={formData.adsenseCode}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, adsenseCode: e.target.value })}
                placeholder="ca-pub-xxxxxxxxxxxxx"
                className="h-11 border-2 focus:border-blue-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="px-6">Cancel</Button>
            <Button onClick={handleCreate} className="gradient-primary text-white px-6 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

