import React, { useState, useEffect } from 'react'
import Login          from './pages/Login.jsx'
import InvoiceForm    from './pages/InvoiceForm.jsx'
import InvoiceList    from './pages/InvoiceList.jsx'
import InvoicePreview from './pages/InvoicePreview.jsx'
import Earnings       from './pages/Earnings.jsx'
import LOGO           from './assets/logo.js'
import { supabase }   from './lib/supabase.js'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('kbl_user')) } catch { return null }
  })
  const [view,           setView]           = useState('list')
  const [invoices,       setInvoices]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [previewInvoice, setPreviewInvoice] = useState(null)

  // ── Load all invoices from Supabase on mount ──────────────────────────────
  useEffect(() => {
    if (!user) return
    loadInvoices()
  }, [user])

  const loadInvoices = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setInvoices(data || [])
    } catch (e) {
      setError('Could not load invoices: ' + e.message)
    }
    setLoading(false)
  }

  // ── Save (insert or update) ───────────────────────────────────────────────
  const handleSave = async (invoice) => {
    setError('')
    try {
      // Map camelCase to snake_case for Supabase columns
      const row = {
        id:             invoice.id,
        invoice_number: invoice.invoiceNumber,
        status:         invoice.status,
        issue_date:     invoice.issueDate,
        due_date:       invoice.dueDate,
        client_name:    invoice.clientName,
        client_email:   invoice.clientEmail,
        client_phone:   invoice.clientPhone,
        client_address: invoice.clientAddress,
        client_company: invoice.clientCompany,
        items:          invoice.items,
        payments:       invoice.payments || [],
        notes:          invoice.notes,
        bank_name:      invoice.bankName,
        account_number: invoice.accountNumber,
        account_name:   invoice.accountName,
        apply_vat:      invoice.applyVAT,
        discount:       invoice.discount,
        subtotal:       invoice.subtotal,
        discount_amt:   invoice.discountAmt,
        vat_amt:        invoice.vatAmt,
        grand_total:    invoice.grandTotal,
        updated_at:     new Date().toISOString(),
      }
      const { error } = await supabase.from('invoices').upsert(row)
      if (error) throw error
      await loadInvoices()
      setView('list')
      setEditingInvoice(null)
    } catch (e) {
      setError('Could not save invoice: ' + e.message)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return
    setError('')
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      setInvoices(prev => prev.filter(i => i.id !== id))
    } catch (e) {
      setError('Could not delete invoice: ' + e.message)
    }
  }

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    setError('')
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setInvoices(prev => prev.map(i => i.id===id ? {...i, status: newStatus} : i))
    } catch (e) {
      setError('Could not update status: ' + e.message)
    }
  }

  // ── Payment added ─────────────────────────────────────────────────────────
  const handlePaymentAdded = async (updatedInvoice) => {
    setError('')
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          payments:    updatedInvoice.payments,
          status:      updatedInvoice.status,
          updated_at:  new Date().toISOString(),
        })
        .eq('id', updatedInvoice.id)
      if (error) throw error
      setInvoices(prev => prev.map(i => i.id===updatedInvoice.id ? updatedInvoice : i))
    } catch (e) {
      setError('Could not save payment: ' + e.message)
    }
  }

  // ── Map Supabase snake_case rows back to camelCase for the UI ─────────────
  const mappedInvoices = invoices.map(r => ({
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
    notes:         r.notes,
    bankName:      r.bank_name,
    accountNumber: r.account_number,
    accountName:   r.account_name,
    applyVAT:      r.apply_vat,
    discount:      r.discount,
    subtotal:      r.subtotal,
    discountAmt:   r.discount_amt,
    vatAmt:        r.vat_amt,
    grandTotal:    r.grand_total,
  }))

  const handleEdit    = (inv) => { setEditingInvoice(inv); setView('form') }
  const handlePreview = (inv) => { setPreviewInvoice(inv); setView('preview') }
  const handleNew     = ()    => { setEditingInvoice(null); setView('form') }
  const handleBack    = ()    => { setEditingInvoice(null); setPreviewInvoice(null); setView('list') }
  const handleLogout  = ()    => { sessionStorage.removeItem('kbl_user'); setUser(null) }

  if (!user) return <Login onLogin={u => { sessionStorage.setItem('kbl_user', JSON.stringify(u)); setUser(u) }} />

  const totalEarnings = mappedInvoices.reduce((s, inv) =>
    s + (inv.payments||[]).reduce((a,p) => a+p.amount, 0), 0)
  const fmtShort = (n) => '₦' + Number(n||0).toLocaleString('en-NG',{minimumFractionDigits:0,maximumFractionDigits:0})

  return (
    <div style={{minHeight:'100vh',background:'var(--cream)'}}>
      {/* Nav */}
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
            {totalEarnings>0&&(
              <span style={{marginLeft:6,background:'var(--amber)',color:'white',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10}}>
                {fmtShort(totalEarnings)}
              </span>
            )}
          </NavBtn>
          <NavBtn active={view==='form'} onClick={handleNew} accent>+ New Invoice</NavBtn>
          <div style={{width:1,height:24,background:'rgba(255,255,255,0.2)',margin:'0 4px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{textAlign:'right'}}>
              <div style={{color:'white',fontSize:12,fontWeight:600}}>{user.username}</div>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:10}}>{user.role}</div>
            </div>
            <button onClick={handleLogout} style={{
              padding:'5px 12px',borderRadius:6,fontSize:12,fontWeight:600,
              background:'rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.8)',
              border:'1px solid rgba(255,255,255,0.2)',
            }}>Log out</button>
          </div>
        </div>
      </nav>

      {/* Global error banner */}
      {error && (
        <div style={{background:'var(--danger-pale)',color:'var(--danger)',padding:'10px 1.5rem',fontSize:13,fontWeight:500,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          ⚠️ {error}
          <button onClick={()=>setError('')} style={{background:'none',color:'var(--danger)',fontSize:16}}>×</button>
        </div>
      )}

      {/* Loading state */}
      {loading && view==='list' && (
        <div style={{textAlign:'center',padding:'4rem',color:'var(--slate-muted)',fontSize:14}}>
          <div style={{fontSize:32,marginBottom:12}}>⏳</div>
          Loading invoices from database…
        </div>
      )}

      {!loading && (
        <>
          {view==='list'     && <InvoiceList     invoices={mappedInvoices} onNew={handleNew} onEdit={handleEdit} onDelete={handleDelete} onPreview={handlePreview} onStatusChange={handleStatusChange} onPaymentAdded={handlePaymentAdded}/>}
          {view==='form'     && <InvoiceForm     invoice={editingInvoice}  onSave={handleSave} onCancel={handleBack}/>}
          {view==='preview'  && <InvoicePreview  invoice={previewInvoice}  onBack={handleBack} onEdit={()=>handleEdit(previewInvoice)}/>}
          {view==='earnings' && <Earnings        invoices={mappedInvoices}/>}
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
      background: accent?'var(--amber)':active?'rgba(255,255,255,0.15)':'transparent',
      color:'white',
      border: accent?'none':active?'1px solid rgba(255,255,255,0.3)':'1px solid transparent',
    }}>{children}</button>
  )
}
