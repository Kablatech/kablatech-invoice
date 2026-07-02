import React, { useRef, useState } from 'react'
import LOGO from '../assets/logo.js'

const fmt = (n) => '₦' + Number(n||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2})
const methodLabel = {transfer:'Bank Transfer',cash:'Cash',cheque:'Cheque',pos:'POS Terminal',ussd:'USSD'}

// ── EmailJS config — fill these in from emailjs.com ─────────────────────────
const EMAILJS_SERVICE_ID  = 'service_oebdptc'
const EMAILJS_TEMPLATE_ID = 'template_q6xbyq4'
const EMAILJS_PUBLIC_KEY  = 'vMhbEoJs0Pyy_qywl'
// ─────────────────────────────────────────────────────────────────────────────

export default function ReceiptModal({ invoice, payment, onClose }) {
  const printRef   = useRef()
  const [sending,  setSending]  = useState(false)
  const [emailSent,setEmailSent] = useState(false)
  const [emailErr, setEmailErr]  = useState('')

  const totalPaid   = (invoice.payments || []).reduce((s,p) => s+p.amount, 0)
  const outstanding = Math.max(0, (invoice.grandTotal||0) - totalPaid)
  const receiptNum  = 'RCP-' + payment.id.toString().slice(-6)

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('','_blank')
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Receipt ${receiptNum}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A5;margin:0}</style>
      </head><body>${content}</body></html>`)
    win.document.close()
    setTimeout(()=>{win.print();win.close()},500)
  }

  const handleEmail = async () => {
    if (!invoice.clientEmail) return setEmailErr('No client email on this invoice.')
    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') return setEmailErr('EmailJS not configured yet. See README for setup instructions.')
    setSending(true); setEmailErr('')
    try {
      const { default: emailjs } = await import('@emailjs/browser')
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email:     invoice.clientEmail,
        to_name:      invoice.clientName,
        receipt_no:   receiptNum,
        invoice_no:   invoice.invoiceNumber,
        amount_paid:  fmt(payment.amount),
        payment_date: payment.date,
        method:       methodLabel[payment.method] || payment.method,
        reference:    payment.reference || 'N/A',
        outstanding:  fmt(outstanding),
        company_name: 'KablaTech Solutions',
        company_phone:'09169621561',
      }, EMAILJS_PUBLIC_KEY)
      setEmailSent(true)
    } catch(e) {
      setEmailErr('Failed to send email. Check EmailJS config.')
    }
    setSending(false)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:1100,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}} onClick={onClose}>
      <div style={{background:'white',borderRadius:16,width:'100%',maxWidth:520,boxShadow:'0 32px 80px rgba(0,0,0,0.3)',overflow:'hidden',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>

        {/* Actions bar */}
        <div style={{background:'var(--slate-faint)',padding:'1rem 1.5rem',display:'flex',gap:10,alignItems:'center',borderBottom:'1px solid var(--slate-border)'}}>
          <div style={{flex:1,fontWeight:700,color:'var(--slate)'}}>Payment Receipt</div>
          <button onClick={handlePrint} style={{padding:'7px 16px',borderRadius:7,background:'var(--forest)',color:'white',fontWeight:600,fontSize:13}}>🖨 Print / PDF</button>
          <button onClick={handleEmail} disabled={sending||emailSent} style={{
            padding:'7px 16px',borderRadius:7,fontWeight:600,fontSize:13,
            background: emailSent?'var(--forest-pale)':sending?'#ccc':'var(--blue-pale)',
            color: emailSent?'var(--forest)':sending?'#888':'var(--blue)',
            border:`1px solid ${emailSent?'var(--forest-light)':sending?'#ccc':'#B5D4F4'}`,
          }}>
            {emailSent?'✅ Sent!':sending?'Sending…':'📧 Email to Client'}
          </button>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:'50%',background:'var(--slate-border)',border:'none',fontSize:16,color:'var(--slate)'}}>×</button>
        </div>

        {emailErr  && <div style={{padding:'8px 16px',background:'var(--danger-pale)',color:'var(--danger)',fontSize:13}}>⚠️ {emailErr}</div>}
        {emailSent && <div style={{padding:'8px 16px',background:'var(--forest-faint)',color:'var(--forest)',fontSize:13}}>✅ Receipt emailed to {invoice.clientEmail}</div>}

        {/* Receipt document */}
        <div ref={printRef} style={{background:'white',fontFamily:"'Inter',sans-serif"}}>

          {/* Header */}
          <div style={{background:'#0D1B4B',padding:'24px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <img src={LOGO} alt="" style={{width:52,height:52,objectFit:'contain',background:'white',borderRadius:8,padding:3}}/>
              <div>
                <div style={{color:'white',fontWeight:800,fontSize:16}}>KablaTech Solutions</div>
                <div style={{color:'rgba(255,255,255,0.55)',fontSize:11,marginTop:1}}>IT & Software Services</div>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase'}}>Payment Receipt</div>
              <div style={{color:'white',fontWeight:800,fontSize:20,marginTop:2}}>{receiptNum}</div>
            </div>
          </div>
          <div style={{height:4,background:'#E76F00'}}/>

          {/* Status stamp */}
          <div style={{padding:'16px 28px',background:'#F0FFF4',borderBottom:'1px solid #D8F3DC',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,color:'#2D6A4F'}}>
              <span style={{fontWeight:700}}>Invoice {invoice.invoiceNumber}</span> — {invoice.clientName}
            </div>
            <div style={{
              padding:'4px 16px',borderRadius:20,fontWeight:800,fontSize:13,
              background: outstanding<=0 ? '#1B4332' : '#E76F00',
              color:'white',letterSpacing:'0.05em'
            }}>{outstanding<=0 ? '✓ FULLY PAID' : 'PART PAYMENT'}</div>
          </div>

          {/* Payment details */}
          <div style={{padding:'20px 28px'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#E76F00',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Payment Details</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 24px'}}>
              <Row label="Amount Paid"     value={fmt(payment.amount)} big />
              <Row label="Payment Date"    value={payment.date} />
              <Row label="Payment Method"  value={methodLabel[payment.method]||payment.method} />
              <Row label="Reference"       value={payment.reference||'—'} />
              {payment.note && <Row label="Note" value={payment.note} />}
            </div>

            <div style={{height:1,background:'#F2F2F7',margin:'16px 0'}}/>
            <div style={{fontSize:11,fontWeight:700,color:'#E76F00',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Account Summary</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              <SumBox label="Invoice Total"   value={fmt(invoice.grandTotal)}  />
              <SumBox label="Total Paid"      value={fmt(totalPaid)}           color="#1B4332" />
              <SumBox label="Balance Due"     value={fmt(outstanding)}          color={outstanding>0?'#E76F00':'#1B4332'} highlight={outstanding>0} />
            </div>
          </div>

          {/* Payment history */}
          {invoice.payments && invoice.payments.length > 1 && (
            <div style={{padding:'0 28px 20px'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#6B6B6E',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Payment History</div>
              {invoice.payments.map((p,i) => (
                <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 12px',borderRadius:7,background:p.id===payment.id?'#F0FFF4':'#FAFAF7',marginBottom:4,fontSize:13}}>
                  <span style={{color:'#6B6B6E'}}>#{i+1} · {p.date} · {methodLabel[p.method]||p.method}</span>
                  <span style={{fontWeight:600,color:'#1B4332'}}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{background:'#0D1B4B',padding:'14px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.45)'}}>10, Elsbeth Ojo Close, Asero, Abeokuta · Tel: 09169621561</span>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.45)'}}>Generated {new Date().toLocaleDateString('en-NG')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({label,value,big}) {
  return (
    <div style={{marginBottom:4}}>
      <div style={{fontSize:11,color:'#6B6B6E',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em'}}>{label}</div>
      <div style={{fontSize:big?18:14,fontWeight:big?800:500,color:big?'#1B4332':'#1C1C1E',marginTop:1}}>{value}</div>
    </div>
  )
}
function SumBox({label,value,color,highlight}) {
  return (
    <div style={{padding:'10px 12px',borderRadius:8,background:highlight?'#FFF3E0':'#F2F2F7',border:`1px solid ${highlight?'#F4A261':'#E5E5EA'}`,textAlign:'center'}}>
      <div style={{fontSize:10,color:'#6B6B6E',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>{label}</div>
      <div style={{fontSize:14,fontWeight:700,color:color||'#1C1C1E'}}>{value}</div>
    </div>
  )
}
