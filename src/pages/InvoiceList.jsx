import React, { useState, useEffect } from 'react'
import PaymentModal  from '../components/PaymentModal.jsx'
import ReceiptModal  from '../components/ReceiptModal.jsx'

const fmt = (n) => '₦' + Number(n||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2})

const SC = {
  draft:   {bg:'#F2F2F7',text:'#6B6B6E',border:'#D1D1D6'},
  sent:    {bg:'#EBF4FF',text:'#185FA5',border:'#B5D4F4'},
  paid:    {bg:'#D8F3DC',text:'#1B4332',border:'#40916C'},
  overdue: {bg:'#FFF0EE',text:'#C0392B',border:'#F09595'},
}
const FLOW = { draft:['sent'], sent:['paid','overdue'], paid:['sent'], overdue:['paid','sent'] }
const SL   = { draft:'Draft', sent:'Sent', paid:'Paid', overdue:'Overdue' }
const HINTS= { sent:'You have shared this invoice with the client', paid:'Client has paid — move to revenue', overdue:'Due date passed, payment not received' }

export default function InvoiceList({ invoices, onNew, onEdit, onDelete, onPreview, onStatusChange, onPaymentAdded }) {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openDrop,     setOpenDrop]     = useState(null)
  const [payInvoice,   setPayInvoice]   = useState(null)   // invoice to pay
  const [receipt,      setReceipt]      = useState(null)   // {invoice, payment}

  useEffect(()=>{
    const h = ()=>setOpenDrop(null)
    document.addEventListener('click',h)
    return ()=>document.removeEventListener('click',h)
  },[])

  const totals = {
    all:     invoices.length,
    draft:   invoices.filter(i=>i.status==='draft').length,
    sent:    invoices.filter(i=>i.status==='sent').length,
    paid:    invoices.filter(i=>i.status==='paid').length,
    overdue: invoices.filter(i=>i.status==='overdue').length,
  }
  const totalRevenue     = invoices.reduce((s,i)=>(i.payments||[]).reduce((a,p)=>a+p.amount,0)+s, 0)
  const totalOutstanding = invoices.filter(i=>['sent','overdue'].includes(i.status)).reduce((s,i)=>{
    const paid=(i.payments||[]).reduce((a,p)=>a+p.amount,0)
    return s+Math.max(0,(i.grandTotal||0)-paid)
  },0)

  const filtered = invoices.filter(inv=>{
    const ms = !search ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())||
      inv.clientName?.toLowerCase().includes(search.toLowerCase())||
      inv.clientEmail?.toLowerCase().includes(search.toLowerCase())
    const mf = statusFilter==='all'||inv.status===statusFilter
    return ms&&mf
  })

  const handlePayment = (payment) => {
    const inv      = payInvoice
    const payments = [...(inv.payments||[]), payment]
    const totalPaid= payments.reduce((s,p)=>s+p.amount,0)
    const isFullyPaid = totalPaid >= (inv.grandTotal||0) - 0.01
    const updated  = { ...inv, payments, status: isFullyPaid ? 'paid' : inv.status }
    onPaymentAdded(updated)
    setPayInvoice(null)
    setReceipt({ invoice: updated, payment })
  }

  return (
    <div style={{maxWidth:1200,margin:'0 auto',padding:'2rem 1.5rem'}}>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:'2rem'}}>
        <StatCard label="Total invoices"    value={invoices.length}        sub="all time" />
        <StatCard label="Revenue collected" value={fmt(totalRevenue)}      sub="all payments received" accent />
        <StatCard label="Outstanding"       value={fmt(totalOutstanding)}  sub="pending payment" warn />
        <StatCard label="Overdue"           value={totals.overdue}         sub="action needed" danger={totals.overdue>0} />
      </div>

      {/* Search + filters */}
      <div style={{display:'flex',gap:12,marginBottom:'1.5rem',flexWrap:'wrap',alignItems:'center'}}>
        <input type="text" placeholder="Search invoice #, client name or email…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{flex:1,minWidth:220,padding:'9px 14px',border:'1px solid var(--slate-border)',borderRadius:8,background:'white',fontSize:14}}/>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {['all','draft','sent','paid','overdue'].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)} style={{
              padding:'7px 13px',borderRadius:7,fontSize:13,fontWeight:500,
              background:statusFilter===s?'var(--forest)':'white',
              color:statusFilter===s?'white':'var(--slate-mid)',
              border:`1px solid ${statusFilter===s?'var(--forest)':'var(--slate-border)'}`,
            }}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
              {totals[s]>0&&<span style={{marginLeft:5,opacity:0.7}}>({totals[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length===0 ? <EmptyState onNew={onNew} hasInvoices={invoices.length>0}/> : (
        <div style={{background:'white',borderRadius:12,border:'1px solid var(--slate-border)',overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
            <thead>
              <tr style={{background:'var(--slate-faint)',borderBottom:'1px solid var(--slate-border)'}}>
                {['Invoice #','Client','Issue Date','Due Date','Total','Paid','Outstanding','Status','Actions'].map(h=>(
                  <th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'var(--slate-muted)',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv,idx)=>{
                const sc        = SC[inv.status]||SC.draft
                const nextSteps = FLOW[inv.status]||[]
                const isOpen    = openDrop===inv.id
                const paidAmt   = (inv.payments||[]).reduce((s,p)=>s+p.amount,0)
                const balance   = Math.max(0,(inv.grandTotal||0)-paidAmt)
                const canPay    = ['sent','overdue'].includes(inv.status) && balance>0

                return (
                  <tr key={inv.id} style={{borderBottom:idx<filtered.length-1?'1px solid var(--slate-faint)':'none',transition:'background 0.1s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                    <td style={{padding:'13px 14px',fontWeight:700,color:'var(--forest)',fontSize:13,whiteSpace:'nowrap'}}>{inv.invoiceNumber}</td>

                    <td style={{padding:'13px 14px'}}>
                      <div style={{fontWeight:600,fontSize:13}}>{inv.clientName}</div>
                      <div style={{fontSize:11,color:'var(--slate-muted)'}}>{inv.clientEmail}</div>
                    </td>

                    <td style={{padding:'13px 14px',fontSize:12,color:'var(--slate-muted)',whiteSpace:'nowrap'}}>{inv.issueDate}</td>
                    <td style={{padding:'13px 14px',fontSize:12,color:'var(--slate-muted)',whiteSpace:'nowrap'}}>{inv.dueDate}</td>

                    <td style={{padding:'13px 14px',fontWeight:600,fontSize:13,whiteSpace:'nowrap'}}>{fmt(inv.grandTotal||0)}</td>

                    <td style={{padding:'13px 14px',fontSize:13,fontWeight:500,color:'var(--forest)',whiteSpace:'nowrap'}}>
                      {paidAmt>0 ? fmt(paidAmt) : <span style={{color:'var(--slate-muted)'}}>—</span>}
                    </td>

                    <td style={{padding:'13px 14px',whiteSpace:'nowrap'}}>
                      {balance>0
                        ? <span style={{fontWeight:700,color:'var(--amber)',fontSize:13}}>{fmt(balance)}</span>
                        : <span style={{color:'var(--forest)',fontWeight:600,fontSize:12}}>✓ Settled</span>}
                    </td>

                    {/* Clickable status badge */}
                    <td style={{padding:'13px 14px',position:'relative'}}>
                      <button onClick={e=>{e.stopPropagation();setOpenDrop(isOpen?null:inv.id)}}
                        style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`,cursor:'pointer',display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
                        {SL[inv.status]} <span style={{fontSize:9,opacity:0.7}}>▾</span>
                      </button>
                      {isOpen&&(
                        <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:200,background:'white',borderRadius:10,border:'1px solid var(--slate-border)',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',minWidth:200,padding:'6px'}}>
                          <div style={{fontSize:10,color:'var(--slate-muted)',fontWeight:700,padding:'4px 8px 6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Change status to:</div>
                          {nextSteps.map(s=>{
                            const c=SC[s]
                            return (
                              <button key={s} onClick={()=>{onStatusChange(inv.id,s);setOpenDrop(null)}}
                                style={{width:'100%',textAlign:'left',padding:'8px 10px',borderRadius:7,border:'none',background:'transparent',cursor:'pointer',display:'block'}}
                                onMouseEnter={e=>e.currentTarget.style.background=c.bg}
                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                <div style={{fontWeight:700,fontSize:13,color:c.text}}>{SL[s]}</div>
                                <div style={{fontSize:11,color:'var(--slate-muted)',marginTop:1}}>{HINTS[s]}</div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{padding:'13px 14px'}}>
                      <div style={{display:'flex',gap:5,flexWrap:'nowrap'}}>
                        <ActionBtn onClick={()=>onPreview(inv)} color="var(--forest)">View</ActionBtn>
                        {canPay && (
                          <ActionBtn onClick={()=>setPayInvoice(inv)} color="var(--amber)" filled>💰 Pay</ActionBtn>
                        )}
                        {inv.payments?.length>0 && (
                          <ActionBtn onClick={()=>setReceipt({invoice:inv,payment:inv.payments[inv.payments.length-1]})} color="var(--blue)">🧾</ActionBtn>
                        )}
                        <ActionBtn onClick={()=>onEdit(inv)} color="#888">Edit</ActionBtn>
                        <ActionBtn onClick={()=>onDelete(inv.id)} color="var(--danger)">Del</ActionBtn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {payInvoice && <PaymentModal invoice={payInvoice} onClose={()=>setPayInvoice(null)} onSave={handlePayment}/>}
      {receipt    && <ReceiptModal invoice={receipt.invoice} payment={receipt.payment} onClose={()=>setReceipt(null)}/>}
    </div>
  )
}

function StatCard({label,value,sub,accent,warn,danger}) {
  const bg     = accent?'var(--forest)':warn?'var(--amber-pale)':danger?'var(--danger-pale)':'white'
  const col    = accent?'white':danger?'var(--danger)':'var(--slate)'
  const subcol = accent?'rgba(255,255,255,0.65)':'var(--slate-muted)'
  return (
    <div style={{background:bg,borderRadius:12,padding:'1.1rem 1.3rem',border:`1px solid ${accent?'transparent':'var(--slate-border)'}`}}>
      <div style={{fontSize:11,color:subcol,fontWeight:600,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</div>
      <div style={{fontSize:20,fontWeight:800,color:col}}>{value}</div>
      <div style={{fontSize:11,color:subcol,marginTop:3}}>{sub}</div>
    </div>
  )
}
function ActionBtn({children,onClick,color,filled}) {
  return (
    <button onClick={onClick} style={{padding:'4px 9px',borderRadius:5,fontSize:11,fontWeight:600,whiteSpace:'nowrap',
      background:filled?color:'transparent',color:filled?'white':color,border:`1px solid ${color}`}}
      onMouseEnter={e=>{e.currentTarget.style.background=color;e.currentTarget.style.color='white'}}
      onMouseLeave={e=>{e.currentTarget.style.background=filled?color:'transparent';e.currentTarget.style.color=filled?'white':color}}>
      {children}
    </button>
  )
}
function EmptyState({onNew,hasInvoices}) {
  return (
    <div style={{textAlign:'center',padding:'5rem 2rem',background:'white',borderRadius:12,border:'1px solid var(--slate-border)'}}>
      <div style={{fontSize:48,marginBottom:16}}>🧾</div>
      <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>{hasInvoices?'No invoices match your filter':'No invoices yet'}</div>
      <div style={{color:'var(--slate-muted)',marginBottom:24,fontSize:14}}>{hasInvoices?'Try a different search or filter.':'Create your first invoice to get started.'}</div>
      {!hasInvoices&&<button onClick={onNew} style={{padding:'10px 24px',borderRadius:8,background:'var(--forest)',color:'white',fontWeight:700,fontSize:14}}>Create invoice</button>}
    </div>
  )
}
