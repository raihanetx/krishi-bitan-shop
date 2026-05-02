'use client'

import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/components/admin/context/AdminContext'
import { useCsrfFetch } from '@/hooks/useCsrfFetch'

interface Credential {
  id: number
  type: 'admin' | 'courier' | 'cloudinary'
  label: string
  icon: string
  timestampKey: string
  fieldKey: string
  hasKey?: string
  required?: boolean
  isSensitive?: boolean
}

const formatLastEdited = (isoString: string | null | undefined): string => {
  if (!isoString) return 'Never edited'
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    let timeAgo = ''
    if (diffDays > 0) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    else if (diffHours > 0) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    else if (diffMinutes > 0) timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    else timeAgo = 'Just now'
    const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
    return `${timeAgo} - ${dateStr} - ${timeStr}`
  } catch {
    return 'Never edited'
  }
}

const CredentialsView: React.FC = () => {
  const { csrfFetch } = useCsrfFetch()
  const { settings, showToastMsg, refetchSettings } = useAdmin()
  const [activeTab, setActiveTab] = useState<'admin' | 'courier' | 'cloudinary'>('admin')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [testing, setTesting] = useState(false)
  const [editValue, setEditValue] = useState('')

  const adminCredentials: Credential[] = useMemo(() => [
    { id: 1, type: 'admin', label: 'Admin Username', icon: 'ri-user-line', timestampKey: 'adminUsernameUpdatedAt', fieldKey: 'adminUsername', required: true, isSensitive: false },
    { id: 2, type: 'admin', label: 'Admin Password', icon: 'ri-lock-line', timestampKey: 'adminPasswordUpdatedAt', fieldKey: 'adminPassword', hasKey: 'hasAdminPassword', required: true, isSensitive: true },
  ], [])

  const hasValue = (cred: Credential): boolean => {
    if (cred.hasKey) return settings[cred.hasKey as keyof typeof settings] === true
    const rawValue = settings[cred.fieldKey as keyof typeof settings]
    return rawValue !== undefined && rawValue !== null && rawValue !== ''
  }

  const getDisplayValue = (cred: Credential): string => {
    if (cred.isSensitive) return ''
    return (settings[cred.fieldKey as keyof typeof settings] as string) || ''
  }

  const startEdit = (cred: Credential) => {
    setEditingId(cred.id)
    setEditValue(cred.isSensitive ? '' : getDisplayValue(cred))
  }

  const cancelEdit = () => { setEditingId(null); setEditValue('') }

  const saveCredential = async (id: number) => {
    const cred = adminCredentials.find(c => c.id === id)
    if (!cred) return
    if (cred.isSensitive && !editValue.trim()) { showToastMsg(`Please enter a value for ${cred.label}`); return }
    if (cred.required && !editValue.trim()) { showToastMsg(`${cred.label} cannot be empty`); return }
    if (!cred.isSensitive) {
      const currentVal = getDisplayValue(cred)
      if (editValue === currentVal) { cancelEdit(); showToastMsg('No changes made'); return }
    }
    setSaving(true)
    try {
      const res = await csrfFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [cred.fieldKey]: editValue.trim() }) })
      const data = await res.json()
      if (data.success) { await refetchSettings(); setEditingId(null); setEditValue(''); showToastMsg(`${cred.label} saved successfully!`) }
      else { showToastMsg(data.error || 'Failed to save') }
    } catch { showToastMsg('Error saving credential') }
    setSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') { e.preventDefault(); saveCredential(id) }
    else if (e.key === 'Escape') cancelEdit()
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const res = await csrfFetch('/api/test-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: activeTab }) })
      const data = await res.json()
      const serviceName = activeTab === 'courier' ? 'Courier API' : 'Cloudinary API'
      if (data.success) showToastMsg(`${serviceName} connected!`, 'success')
      else showToastMsg(`${serviceName} not connected`, 'error')
    } catch { showToastMsg('Connection test failed', 'error') }
    setTesting(false)
  }

  const canTest = activeTab === 'courier' || activeTab === 'cloudinary'

  return (
    <div className="p-12 bg-white min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style jsx global>{`
        .rounded-5 { border-radius: 5px !important; }
        .table-container { border: 1px solid #cbd5e1; border-radius: 5px; overflow: hidden; }
        .credentials-table { width: 100%; border-collapse: collapse; }
        .credentials-table th, .credentials-table td { border: 1px solid #cbd5e1; }
        .credentials-table tr th:first-child, .credentials-table tr td:first-child { border-left: none; }
        .credentials-table tr th:last-child, .credentials-table tr td:last-child { border-right: none; }
        .credentials-table thead tr:first-child th { border-top: none; }
        .credentials-table tbody tr:last-child td { border-bottom: none; }
        .typing-input {
          background: transparent; border: none; border-radius: 0; outline: none;
          text-align: center; width: 100%; padding: 0; font-weight: 500; color: #0f172a; font-size: 16px !important;
        }
        .typing-input:focus { outline: none; }
        .typing-input::placeholder { color: #94a3b8; font-style: italic; }
        .edit-actions { display: flex; gap: 8px; justify-content: center; }
        .action-btn {
          width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s; border: none;
        }
        .action-btn.save { background: #16a34a; color: white; }
        .action-btn.save:hover { background: #15803d; }
        .action-btn.cancel { background: #fee2e2; color: #dc2626; }
        .action-btn.cancel:hover { background: #fecaca; }
        .action-btn.edit { background: #f1f5f9; color: #64748b; }
        .action-btn.edit:hover { background: #e2e8f0; color: #0f172a; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <button onClick={() => { setActiveTab('admin'); cancelEdit() }} className={`px-5 py-1.5 border rounded-5 text-sm font-semibold transition-all ${activeTab === 'admin' ? 'border-slate-800 text-slate-900 bg-slate-50' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>Admin Credentials</button>
          <button onClick={() => { setActiveTab('courier'); cancelEdit() }} className={`px-5 py-1.5 border rounded-5 text-sm font-semibold transition-all ${activeTab === 'courier' ? 'border-slate-800 text-slate-900 bg-slate-50' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>Courier API</button>
          <button onClick={() => { setActiveTab('cloudinary'); cancelEdit() }} className={`px-5 py-1.5 border rounded-5 text-sm font-semibold transition-all ${activeTab === 'cloudinary' ? 'border-slate-800 text-slate-900 bg-slate-50' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>Cloudinary</button>
          {canTest && (
            <button onClick={testConnection} disabled={testing} className={`px-5 py-1.5 border rounded-5 text-sm font-semibold transition-all ${testing ? 'border-slate-400 text-slate-500 bg-slate-100 cursor-not-allowed' : 'border-green-600 text-green-700 bg-green-50 hover:bg-green-100'}`}>
              {testing ? <><i className="ri-loader-4-line animate-spin mr-2"></i>Testing...</> : <><i className="ri-plug-line mr-2"></i>Test Connection</>}
            </button>
          )}
        </div>

        {/* Admin Credentials Table */}
        {activeTab === 'admin' && (
          <div className="table-container">
            <table className="credentials-table">
              <thead className="bg-slate-50">
                <tr className="text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4 text-left font-bold">Credential Name</th>
                  <th className="px-6 py-4 text-center font-bold">Status / Value</th>
                  <th className="px-6 py-4 text-center font-bold">Last Edited</th>
                  <th className="px-6 py-4 text-center font-bold w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {adminCredentials.map((cred) => {
                  const timestamp = settings[cred.timestampKey as keyof typeof settings] as string | null
                  const isEditing = editingId === cred.id
                  const hasVal = hasValue(cred)
                  return (
                    <tr key={cred.id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 border border-slate-200 rounded-full flex items-center justify-center text-slate-400"><i className={`${cred.icon} text-[10px]`}></i></div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{cred.label}</span>
                            <div className="flex items-center gap-2">
                              {cred.required && <span className="text-[10px] text-red-400">Required</span>}
                              {cred.isSensitive && <span className="text-[10px] text-amber-500">Sensitive</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <input type={cred.fieldKey.includes('password') ? 'password' : 'text'} value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => handleKeyDown(e, cred.id)} className="typing-input" style={{ fontSize: '16px' }} autoFocus disabled={saving} placeholder={cred.isSensitive ? 'Enter new value...' : `Enter ${cred.label.toLowerCase()}...`} />
                        ) : (
                          <span className="text-sm text-slate-600">{hasVal ? '••••••••' : 'Not set'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center"><span className="text-xs text-slate-400 font-medium">{formatLastEdited(timestamp)}</span></td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="edit-actions">
                            <button onClick={() => saveCredential(cred.id)} className="action-btn save" disabled={saving || !editValue.trim()} title="Save"><i className="ri-check-line text-sm"></i></button>
                            <button onClick={cancelEdit} className="action-btn cancel" disabled={saving} title="Cancel"><i className="ri-close-line text-sm"></i></button>
                          </div>
                        ) : (
                          <div className="edit-actions">
                            <button onClick={() => startEdit(cred)} className="action-btn edit" disabled={saving} title="Edit"><i className="ri-pencil-line text-sm"></i></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Env Vars Managed Notice for Courier & Cloudinary */}
        {(activeTab === 'courier' || activeTab === 'cloudinary') && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <i className="ri-shield-keyhole-line text-amber-600 text-lg"></i>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-1">Managed via Environment Variables</h3>
                <p className="text-sm text-amber-700 mb-3">
                  {activeTab === 'courier' 
                    ? 'Steadfast Courier credentials (API Key, Secret Key) are read from environment variables for security. They are never stored in the database or exposed via API.'
                    : 'Cloudinary credentials (Cloud Name, API Key, API Secret) are read from environment variables for security. They are never stored in the database or exposed via API.'
                  }
                </p>
                <div className="bg-amber-100/60 rounded-md p-3">
                  <p className="text-xs font-mono text-amber-900">
                    {activeTab === 'courier' ? (
                      <>
                        STEADFAST_API_KEY=your-api-key<br/>
                        STEADFAST_SECRET_KEY=your-secret-key<br/>
                        STEADFAST_WEBHOOK_SECRET=your-webhook-secret
                      </>
                    ) : (
                      <>
                        CLOUDINARY_CLOUD_NAME=your-cloud-name<br/>
                        CLOUDINARY_API_KEY=your-api-key<br/>
                        CLOUDINARY_API_SECRET=your-api-secret
                      </>
                    )}
                  </p>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  Set these in your <strong>.env</strong> file or <strong>Vercel → Settings → Environment Variables</strong>.
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-4 pt-4 border-t border-amber-200">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${activeTab === 'courier' ? (settings.hasSteadfastApiKey ? 'bg-green-500' : 'bg-red-400') : (settings.hasCloudinaryApiSecret ? 'bg-green-500' : 'bg-red-400')}`}></div>
                <span className="text-sm text-amber-800">
                  {activeTab === 'courier' 
                    ? (settings.hasSteadfastApiKey ? 'Steadfast credentials configured' : 'Steadfast credentials not configured')
                    : (settings.hasCloudinaryApiSecret ? 'Cloudinary credentials configured' : 'Cloudinary credentials not configured')
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {saving && (
          <div className="mt-4 text-center text-sm text-slate-400">
            <i className="ri-loader-4-line animate-spin mr-2"></i>Saving...
          </div>
        )}
      </div>
    </div>
  )
}

export default CredentialsView
