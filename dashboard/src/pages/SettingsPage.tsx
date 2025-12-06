import { useEffect, useState, ChangeEvent } from 'react'
import { authAPI, aiProviderAPI, type AIProviderConfig } from '@/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Sparkles, Zap, Loader } from 'lucide-react'
import type { User } from '@/types'

interface RegisterFormData {
  email: string;
  password: string;
  role: 'admin' | 'manager';
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [registerDialogOpen, setRegisterDialogOpen] = useState<boolean>(false)
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    role: 'admin',
  })
  const [aiProviders, setAiProviders] = useState<AIProviderConfig | null>(null)
  const [loadingProviders, setLoadingProviders] = useState<boolean>(false)
  const [savingProviders, setSavingProviders] = useState<boolean>(false)

  useEffect(() => {
    loadUser()
    loadAIProviders()
  }, [])

  const loadUser = async (): Promise<void> => {
    try {
      const response = await authAPI.getCurrentUser()
      setUser(response.data.user)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadAIProviders = async (): Promise<void> => {
    try {
      setLoadingProviders(true)
      const response = await aiProviderAPI.get()
      setAiProviders(response.data)
    } catch (error) {
      console.error('Error loading AI providers:', error)
    } finally {
      setLoadingProviders(false)
    }
  }

  const handleToggleProvider = async (provider: 'openai' | 'gemini', enabled: boolean): Promise<void> => {
    if (!aiProviders || savingProviders) return
    
    try {
      setSavingProviders(true)
      const updated = {
        ...aiProviders,
        [provider]: {
          ...aiProviders[provider],
          enabled,
        },
      }
      console.log('Updating AI provider:', provider, 'to', enabled)
      const response = await aiProviderAPI.update(updated)
      console.log('Update successful:', response.data)
      setAiProviders(response.data)
    } catch (error: any) {
      console.error('Error updating AI provider:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update AI provider settings'
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        alert('Permission denied. Only admins can update AI provider settings.')
      } else {
        alert(`Error: ${errorMessage}`)
      }
      
      // Reload providers to get current state
      await loadAIProviders()
    } finally {
      setSavingProviders(false)
    }
  }

  const handleRegister = async (): Promise<void> => {
    try {
      await authAPI.register(formData.email, formData.password, formData.role)
      setRegisterDialogOpen(false)
      setFormData({ email: '', password: '', role: 'admin' })
      alert('User created successfully')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create user')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system settings</p>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm font-medium">{user.role}</span></p>
            </div>
          )}
          <Button onClick={() => setRegisterDialogOpen(true)} className="gradient-primary text-white">
            Create New User
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Provider Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProviders ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : aiProviders ? (
            <div className="space-y-6">
              {user && user.role !== 'admin' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Only administrators can modify AI provider settings.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {/* OpenAI Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">OpenAI</h3>
                      <p className="text-sm text-muted-foreground">
                        {aiProviders.openai.hasApiKey ? (
                          <span className="text-green-600">API key configured</span>
                        ) : (
                          <span className="text-red-600">API key not configured</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <label className={`relative inline-flex items-center ${savingProviders || !user || user.role !== 'admin' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={aiProviders.openai.enabled}
                      onChange={(e) => handleToggleProvider('openai', e.target.checked)}
                      disabled={savingProviders || !user || user.role !== 'admin'}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${savingProviders || !user || user.role !== 'admin' ? 'opacity-50' : ''}`}>
                      {savingProviders && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader className="w-3 h-3 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Gemini Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Google Gemini</h3>
                      <p className="text-sm text-muted-foreground">
                        {aiProviders.gemini.hasApiKey ? (
                          <span className="text-green-600">API key configured</span>
                        ) : (
                          <span className="text-red-600">API key not configured</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <label className={`relative inline-flex items-center ${savingProviders || !user || user.role !== 'admin' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={aiProviders.gemini.enabled}
                      onChange={(e) => handleToggleProvider('gemini', e.target.checked)}
                      disabled={savingProviders || !user || user.role !== 'admin'}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 ${savingProviders || !user || user.role !== 'admin' ? 'opacity-50' : ''}`}>
                      {savingProviders && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader className="w-3 h-3 animate-spin text-purple-600" />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Note:</strong> API keys should be configured in the backend <code className="bg-blue-100 px-1 rounded">.env</code> file. 
                  The system will use enabled providers in order: OpenAI first, then Gemini as fallback.
                </p>
                {(!aiProviders.openai.hasApiKey || !aiProviders.gemini.hasApiKey) && (
                  <p className="text-sm text-amber-700 mt-2">
                    <strong>Warning:</strong> {!aiProviders.openai.hasApiKey && !aiProviders.gemini.hasApiKey 
                      ? 'No API keys are configured. Please add at least one API key in the .env file.'
                      : !aiProviders.openai.hasApiKey 
                        ? 'OpenAI API key is not configured. It will not be used even if enabled.'
                        : 'Gemini API key is not configured. It will not be used even if enabled.'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Failed to load AI provider settings</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 mt-2"
                value={formData.role}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' })}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRegister} className="gradient-primary text-white">Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
