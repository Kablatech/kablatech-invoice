import React, { useState } from 'react'
import Login         from './pages/Login.jsx'
import InvoiceForm   from './pages/InvoiceForm.jsx'
import InvoiceList   from './pages/InvoiceList.jsx'
import InvoicePreview from './pages/InvoicePreview.jsx'
import Earnings      from './pages/Earnings.jsx'
import LOGO          from './assets/logo.js'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('kbl_user')) } catch { return null }
  })
  const [view,            setView]            = useState('list')
  const [invoices,        setInvoices]        = useState(() => {
    try { return JSON.parse(localStorage.getItem('kbl_invoices')||'[]') } catch { return [] }
  })
  const [editingInvoice,  setEditingInvoice]  = useState(null)
  const [previewInvoice,  setPreviewInvoice]  = useState(null)

  if (!user) return <Login onLogin={u => { sessionStorage.setItem('kbl_user', JSON.stringify(u)); setUser(u) }} />

  const save = (updated) => {
    setInvoices(updated)
    localStorage.setItem('kbl_invoices', JSON.stringify(updated))
  }

  const handleSave = (invoice) => {
    const exists = invoices.find(i => i.id === invoice.id)
    save(exists ? invoices.map(i => i.id===invoice.id ? invoice : i) : [invoice, ...invoices])
    setView('list'); setEditingInvoice(null)
  }
  const handleDelete = (id) => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return
    save(invoices.filter(i => i.id !== id))
  }
  const handleStatusChange = (id, newStatus) => {
    save(invoices.map(i => i.id===id ? {...i, status: newStatus} : i))
  }
  const handlePaymentAdded = (updatedInvoice) => {
    save(invoices.map(i => i.id===updatedInvoice.id ? updatedInvoice : i))
  }
  const handleEdit    = (inv) => { setEditingInvoice(inv); setView('form') }
  const handlePreview = (inv) => { setPreviewInvoice(inv); setView('preview') }
  const handleNew     = ()    => { setEditingInvoice(null); setView('form') }
  const handleBack    = ()    => { setEditingInvoice(null); setPreviewInvoice(null); setView('list') }
  const handleLogout  = ()    => { sessionStorage.removeItem('kbl_user'); setUser(null) }

  // Total earnings badge for nav
  const totalEarnings = invoices.reduce((s,inv) =>
    s + (inv.payments||[]).reduce((a,p) => a+p.amount, 0), 0)
  const fmt = (n) => '₦' + Number(n||0).toLocaleString('en-NG',{minimumFractionDigits:0,maximumFractionDigits:0})

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
            {totalEarnings>0 && (
              <span style={{marginLeft:6,background:'var(--amber)',color:'white',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10}}>
                {fmt(totalEarnings)}
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

      {view==='list'     && <InvoiceList    invoices={invoices} onNew={handleNew} onEdit={handleEdit} onDelete={handleDelete} onPreview={handlePreview} onStatusChange={handleStatusChange} onPaymentAdded={handlePaymentAdded}/>}
      {view==='form'     && <InvoiceForm    invoice={editingInvoice} onSave={handleSave} onCancel={handleBack}/>}
      {view==='preview'  && <InvoicePreview invoice={previewInvoice} onBack={handleBack} onEdit={()=>handleEdit(previewInvoice)}/>}
      {view==='earnings' && <Earnings       invoices={invoices}/>}
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
