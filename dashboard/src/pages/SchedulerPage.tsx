import { useEffect, useState, ChangeEvent } from 'react'
import { tenantAPI, cronAPI } from '@/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import type { Tenant } from '@/types'

export default function SchedulerPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState<boolean>(true)

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

  const handleUpdateFrequency = async (tenantId: string, frequency: number): Promise<void> => {
    try {
      await cronAPI.updateFrequency(tenantId, frequency)
      loadTenants()
      alert('Cron frequency updated')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update frequency')
    }
  }

  const handleRunNow = async (tenantId: string): Promise<void> => {
    try {
      await cronAPI.run(tenantId)
      alert('Content generation started')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to run cron')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gradient mb-2">Scheduler</h1>
        <p className="text-muted-foreground">Manage automated content generation schedules</p>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Cron Schedule Management</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tenants found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Posts/Day</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant._id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.domain}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={tenant.cronFrequency}
                            className="w-20"
                            min="1"
                            max="50"
                            onBlur={(e: ChangeEvent<HTMLInputElement>) => {
                              const newFreq = parseInt(e.target.value)
                              if (newFreq !== tenant.cronFrequency) {
                                handleUpdateFrequency(tenant._id, newFreq)
                              }
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunNow(tenant._id)}
                        >
                          Run Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
