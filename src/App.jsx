import React, { useState, useEffect } from 'react'
import Login          from './pages/Login.jsx'
import InvoiceForm    from './pages/InvoiceForm.jsx'
import InvoiceList    from './pages/InvoiceList.jsx'
import InvoicePreview from './pages/InvoicePreview.jsx'
import Earnings       from './pages/Earnings.jsx'
import LOGO           from './assets/logo.js'
import { supabase }   from './lib/supabase.js'

// ── Convert Supabase snake_case row → camelCase for the UI ───────────────────
const toUI = (r) => ({
  id:            r.id,
  invoiceNumber: r.invoice_number,
  status:        r.status,
  issueDate:     r.issue_date,
  dueDate:       r.due_date,
  clientName:    r.client_name,
  clientEmail:   r.client_email,
  clientPhone:   r.client_phone,
  clientAddress: r.client_address,
  clientCompany: r.client_company,
  items:         r.items         || [],
  payments:      r.payments      || [],
  notes:         r.notes         || '',
  bankName:      r.bank_name     || '',
  accountNumber: r.account_number|| '',
  accountName:   r.account_name  || '',
  applyVAT:      r.apply_vat,
  discount:      r.discount      || 0,
  subtotal:      r.subtotal      || 0,
  discountAmt:   r.discount_amt  || 0,
  vatAmt:        r.vat_amt       || 0,
  grandTotal:    r.grand_total   || 0,
})

// ── Convert camelCase UI invoice → Supabase snake_case row ───────────────────
const toDB = (inv) => ({
  id:             inv.id,
  invoice_number: inv.invoiceNumber,
  status:         inv.status,
  issue_date:     inv.issueDate,
  due_date:       inv.dueDate,
  client_name:    inv.clientName,
  client_email:   inv.clientEmail,
  client_phone:   inv.clientPhone,
  client_address: inv.clientAddress,
  client_company: inv.clientCompany,
  items:          inv.items      || [],
  payments:       inv.payments   || [],
  notes:          inv.notes      || '',
  bank_name:      inv.bankName   || '',
  account_number: inv.accountNumber || '',
  account_name:   inv.accountName   || '',
  apply_vat:      inv.applyVAT,
  discount:       inv.discount   || 0,
  subtotal:       inv.subtotal   || 0,
  discount_amt:   inv.discountAmt|| 0,
  vat_amt:        inv.vatAmt     || 0,
  grand_total:    inv.grandTotal || 0,
  updated_at:     new Date().toISOString(),
})

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('kbl_user')) } catch { return null }
  })
  const [view,           setView]           = useState('list')
  const [invoices,       setInvoices]       = useState([])  // always camelCase
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [previewInvoice, setPreviewInvoice] = useState(null)

  useEffect(() => { if (user) loadInvoices() }, [user])

  const loadInvoices = async () => {
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase
        .from('invoices').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setInvoices((data || []).map(toUI))
    } catch (e) { setError('Could not load invoices: ' + e.message) }
    setLoading(false)
  }

  const handleSave = async (invoice) => {
    setError('')
    try {
      const { error } = await supabase.from('invoices').upsert(toDB(invoice))
      if (error) throw error
      setInvoices(prev => {
        const exists = prev.find(i => i.id === invoice.id)
        return exists ? prev.map(i => i.id===invoice.id ? invoice : i) : [invoice, ...prev]
      })
      setView('list'); setEditingInvoice(null)
    } catch (e) { setError('Could not save invoice: ' + e.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return
    setError('')
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      setInvoices(prev => prev.filter(i => i.id !== id))
    } catch (e) { setError('Could not delete invoice: ' + e.message) }
  }

  const handleStatusChange = async (id, newStatus) => {
    setError('')
    try {
      const { error } = await supabase
        .from('invoices').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setInvoices(prev => prev.map(i => i.id===id ? {...i, status: newStatus} : i))
    } catch (e) { setError('Could not update status: ' + e.message) }
  }

  const handlePaymentAdded = async (updatedInvoice) => {
    setError('')
    try {
      const { error } = await supabase.from('invoices')
        .update({ payments: updatedInvoice.payments, status: updatedInvoice.status, updated_at: new Date().toISOString() })
        .eq('id', updatedInvoice.id)
      if (error) throw error
      setInvoices(prev => prev.map(i => i.id===updatedInvoice.id ? updatedInvoice : i))
    } catch (e) { setError('Could not save payment: ' + e.message) }
  }

  const handleEdit    = (inv) => { setEditingInvoice(inv); setView('form') }
  const handlePreview = (inv) => { setPreviewInvoice(inv); setView('preview') }
  const handleNew     = ()    => { setEditingInvoice(null); setView('form') }
  const handleBack    = ()    => { setEditingInvoice(null); setPreviewInvoice(null); setView('list') }
  const handleLogout  = ()    => { sessionStorage.removeItem('kbl_user'); setUser(null) }

  if (!user) return <Login onLogin={u => { sessionStorage.setItem('kbl_user', JSON.stringify(u)); setUser(u) }} />

  const totalEarnings = invoices.reduce((s,inv) => s+(inv.payments||[]).reduce((a,p)=>a+p.amount,0), 0)
  const fmtShort = (n) => '₦'+Number(n||0).toLocaleString('en-NG',{minimumFractionDigits:0,maximumFractionDigits:0})

  return (
    <div style={{minHeight:'100vh',background:'var(--cream)'}}>
      <nav style={{
        background:'var(--forest)',padding:'0 1.5rem',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        height:58,position:'sticky',top:0,zIndex:100,
        boxShadow:'0 1px 8px rgba(0,0,0,0.18)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src={LOGO} alt="KablaTech" style={{height:40,width:40,objectFit:'contain',background:'white',borderRadius:7,padding:2}}/>
          <div>
            <div style={{color:'white',fontWeight:700,fontSize:15,lineHeight:1.2}}>Kablatech Solutions</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:10}}>Invoice Management</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <NavBtn active={view==='list'}     onClick={handleBack}>🧾 Invoices</NavBtn>
          <NavBtn active={view==='earnings'} onClick={()=>setView('earnings')}>
            💰 Earnings
            {totalEarnings>0&&<span style={{marginLeft:6,background:'var(--amber)',color:'white',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10}}>{fmtShort(totalEarnings)}</span>}
          </NavBtn>
          <NavBtn active={view==='form'} onClick={handleNew} accent>+ New Invoice</NavBtn>
          <div style={{width:1,height:24,background:'rgba(255,255,255,0.2)',margin:'0 4px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{textAlign:'right'}}>
              <div style={{color:'white',fontSize:12,fontWeight:600}}>{user.username}</div>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:10}}>{user.role}</div>
            </div>
            <button onClick={handleLogout} style={{padding:'5px 12px',borderRadius:6,fontSize:12,fontWeight:600,background:'rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.8)',border:'1px solid rgba(255,255,255,0.2)'}}>Log out</button>
          </div>
        </div>
      </nav>

      {error&&(
        <div style={{background:'var(--danger-pale)',color:'var(--danger)',padding:'10px 1.5rem',fontSize:13,fontWeight:500,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          ⚠️ {error}
          <button onClick={()=>setError('')} style={{background:'none',color:'var(--danger)',fontSize:16}}>×</button>
        </div>
      )}

      {loading && view==='list' ? (
        <div style={{textAlign:'center',padding:'4rem',color:'var(--slate-muted)',fontSize:14}}>
          <div style={{fontSize:32,marginBottom:12}}>⏳</div>
          Loading invoices from database…
        </div>
      ) : (
        <>
          {view==='list'     && <InvoiceList     invoices={invoices} onNew={handleNew} onEdit={handleEdit} onDelete={handleDelete} onPreview={handlePreview} onStatusChange={handleStatusChange} onPaymentAdded={handlePaymentAdded}/>}
          {view==='form'     && <InvoiceForm     invoice={editingInvoice} onSave={handleSave} onCancel={handleBack}/>}
          {view==='preview'  && <InvoicePreview  invoice={previewInvoice} onBack={handleBack} onEdit={()=>handleEdit(previewInvoice)}/>}
          {view==='earnings' && <Earnings        invoices={invoices}/>}
        </>
      )}
    </div>
  )
}

function NavBtn({children,active,onClick,accent}) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px',borderRadius:6,fontWeight:600,fontSize:13,
      display:'flex',alignItems:'center',gap:4,
      background:accent?'var(--amber)':active?'rgba(255,255,255,0.15)':'transparent',
      color:'white',
      border:accent?'none':active?'1px solid rgba(255,255,255,0.3)':'1px solid transparent',
    }}>{children}</button>
  )
}
