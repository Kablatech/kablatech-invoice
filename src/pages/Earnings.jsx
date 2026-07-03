import React, { useState, useMemo } from 'react'

const fmt = (n) => '₦' + Number(n||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2})
const METHOD_LABEL = {transfer:'Bank Transfer',cash:'Cash',cheque:'Cheque',pos:'POS',ussd:'USSD'}
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS = ['#1B4332','#2D6A4F','#40916C','#E76F00','#F4A261','#1565C0','#185FA5','#6B6B6E','#C0392B','#27AE60','#8E44AD','#F39C12']

export default function Earnings({ invoices }) {
  const currentYear  = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [view, setView] = useState('monthly') // 'monthly' | 'yearly'

  // Extract all payments from all invoices
  const allPayments = useMemo(() => {
    const list = []
    invoices.forEach(inv => {
      (inv.payments||[]).forEach(p => {
        list.push({
          ...p,
          clientName:    inv.clientName,
          invoiceNumber: inv.invoiceNumber,
          clientEmail:   inv.clientEmail,
        })
      })
    })
    return list.sort((a,b) => new Date(b.date) - new Date(a.date))
  }, [invoices])

  // Available years
  const years = useMemo(() => {
    const ys = new Set(allPayments.map(p => new Date(p.date).getFullYear()))
    ys.add(currentYear)
    return [...ys].sort((a,b) => b-a)
  }, [allPayments, currentYear])

  // Payments for selected year
  const yearPayments = useMemo(() =>
    allPayments.filter(p => new Date(p.date).getFullYear() === year)
  , [allPayments, year])

  // Monthly breakdown for selected year
  const monthlyData = useMemo(() => {
    return MONTHS.map((name, idx) => {
      const payments = yearPayments.filter(p => new Date(p.date).getMonth() === idx)
      return { name, total: payments.reduce((s,p)=>s+p.amount,0), count: payments.length, payments }
    })
  }, [yearPayments])

  // Yearly breakdown
  const yearlyData = useMemo(() => {
    return years.map(y => {
      const payments = allPayments.filter(p => new Date(p.date).getFullYear() === y)
      return { year: y, total: payments.reduce((s,p)=>s+p.amount,0), count: payments.length }
    })
  }, [allPayments, years])

  // Method breakdown
  const methodData = useMemo(() => {
    const map = {}
    yearPayments.forEach(p => {
      map[p.method] = (map[p.method]||0) + p.amount
    })
    return Object.entries(map).map(([method,total])=>({method,total})).sort((a,b)=>b.total-a.total)
  }, [yearPayments])

  const yearTotal   = yearPayments.reduce((s,p)=>s+p.amount,0)
  const allTimeTotal= allPayments.reduce((s,p)=>s+p.amount,0)
  const maxMonthly  = Math.max(...monthlyData.map(m=>m.total), 1)
  const maxYearly   = Math.max(...yearlyData.map(y=>y.total), 1)

  // Selected month detail
  const [selectedMonth, setSelectedMonth] = useState(null)
  const detailPayments = selectedMonth !== null
    ? monthlyData[selectedMonth].payments
    : yearPayments

  return (
    <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem'}}>

      {/* Page header */}
      <div style={{marginBottom:'1.75rem'}}>
        <h1 style={{fontSize:22,fontWeight:800,color:'var(--forest)',letterSpacing:'-0.3px'}}>Earnings</h1>
        <p style={{fontSize:13,color:'var(--slate-muted)',marginTop:3}}>Track all payments received from your clients.</p>
      </div>

      {/* Top stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:'1.75rem'}}>
        <BigStat label="All-time earnings"    value={fmt(allTimeTotal)}          accent />
        <BigStat label={`${year} earnings`}   value={fmt(yearTotal)}             />
        <BigStat label={`${year} payments`}   value={yearPayments.length}        sub="transactions" />
        <BigStat label="Avg per transaction"  value={fmt(yearPayments.length ? yearTotal/yearPayments.length : 0)} />
      </div>

      {/* View toggle + year selector */}
      <div style={{display:'flex',gap:10,marginBottom:'1.5rem',alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',background:'var(--slate-faint)',borderRadius:8,padding:3,gap:2}}>
          {['monthly','yearly'].map(v=>(
            <button key={v} onClick={()=>{setView(v);setSelectedMonth(null)}} style={{
              padding:'6px 16px',borderRadius:6,fontSize:13,fontWeight:600,border:'none',
              background:view===v?'white':'transparent',
              color:view===v?'var(--forest)':'var(--slate-muted)',
              boxShadow:view===v?'0 1px 4px rgba(0,0,0,0.1)':'none',
            }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
        {view==='monthly' && (
          <select value={year} onChange={e=>setYear(Number(e.target.value))} style={{
            padding:'7px 12px',borderRadius:7,border:'1px solid var(--slate-border)',
            background:'white',fontSize:13,fontWeight:600,color:'var(--forest)',
          }}>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {selectedMonth!==null && (
          <button onClick={()=>setSelectedMonth(null)} style={{
            padding:'6px 14px',borderRadius:7,fontSize:13,fontWeight:600,
            background:'var(--forest-faint)',color:'var(--forest)',border:'1px solid var(--forest-pale)',
          }}>← Back to all months</button>
        )}
      </div>

      {/* Charts row */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:'1.75rem'}}>

        {/* Bar chart */}
        <div style={{background:'white',borderRadius:12,border:'1px solid var(--slate-border)',padding:'1.25rem 1.5rem'}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--slate)',marginBottom:'1rem'}}>
            {view==='monthly' ? `Monthly Earnings — ${year}` : 'Yearly Earnings'}
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:view==='monthly'?6:12,height:160,paddingBottom:4}}>
            {view==='monthly' ? monthlyData.map((m,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',cursor:m.total>0?'pointer':'default'}}
                onClick={()=>m.total>0&&setSelectedMonth(i)}>
                <div style={{
                  width:'100%',borderRadius:'4px 4px 0 0',
                  height: m.total>0 ? Math.max(4,(m.total/maxMonthly)*140) : 2,
                  background: selectedMonth===i ? 'var(--amber)' : m.total>0 ? 'var(--forest)' : 'var(--slate-faint)',
                  transition:'all 0.2s',
                  position:'relative',
                }}>
                  {m.total>0&&(
                    <div style={{
                      position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',
                      background:'var(--slate)',color:'white',fontSize:9,fontWeight:600,
                      padding:'2px 5px',borderRadius:3,whiteSpace:'nowrap',pointerEvents:'none',
                    }}>
                      {fmt(m.total)}
                    </div>
                  )}
                </div>
                <div style={{fontSize:9,fontWeight:600,color:selectedMonth===i?'var(--amber)':'var(--slate-muted)',marginTop:4}}>{m.name}</div>
              </div>
            )) : yearlyData.map((y,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{
                  width:'100%',borderRadius:'4px 4px 0 0',
                  height: y.total>0 ? Math.max(4,(y.total/maxYearly)*140) : 2,
                  background:COLORS[i%COLORS.length],transition:'all 0.2s',position:'relative',
                }}>
                  {y.total>0&&(
                    <div style={{position:'absolute',bottom:'105%',left:'50%',transform:'translateX(-50%)',background:'var(--slate)',color:'white',fontSize:9,fontWeight:600,padding:'2px 5px',borderRadius:3,whiteSpace:'nowrap',pointerEvents:'none'}}>
                      {fmt(y.total)}
                    </div>
                  )}
                </div>
                <div style={{fontSize:9,fontWeight:600,color:'var(--slate-muted)',marginTop:4}}>{y.year}</div>
              </div>
            ))}
          </div>
          {view==='monthly'&&<div style={{fontSize:11,color:'var(--slate-muted)',marginTop:8,textAlign:'center'}}>Click a bar to see that month's payments</div>}
        </div>

        {/* Payment method breakdown */}
        <div style={{background:'white',borderRadius:12,border:'1px solid var(--slate-border)',padding:'1.25rem 1.5rem'}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--slate)',marginBottom:'1rem'}}>
            {view==='monthly'?`${year} by Method`:'All-time by Method'}
          </div>
          {methodData.length===0 ? (
            <div style={{color:'var(--slate-muted)',fontSize:13,textAlign:'center',paddingTop:40}}>No payments yet</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {methodData.map((m,i)=>{
                const pct = view==='monthly' ? (m.total/yearTotal)*100 : (m.total/allTimeTotal)*100
                return (
                  <div key={i}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600,color:'var(--slate)'}}>{METHOD_LABEL[m.method]||m.method}</span>
                      <span style={{fontSize:12,fontWeight:700,color:'var(--forest)'}}>{fmt(m.total)}</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:'var(--slate-faint)'}}>
                      <div style={{height:'100%',borderRadius:3,background:COLORS[i%COLORS.length],width:`${pct}%`,transition:'width 0.4s'}}/>
                    </div>
                    <div style={{fontSize:10,color:'var(--slate-muted)',marginTop:2}}>{pct.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment records table */}
      <div style={{background:'white',borderRadius:12,border:'1px solid var(--slate-border)',overflow:'hidden'}}>
        <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid var(--slate-faint)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:700,fontSize:14,color:'var(--slate)'}}>
            {selectedMonth!==null
              ? `${MONTHS[selectedMonth]} ${year} — Payment Records`
              : view==='monthly' ? `All ${year} Payment Records` : 'All Payment Records'}
          </div>
          <div style={{fontSize:13,fontWeight:600,color:'var(--forest)'}}>
            {detailPayments.length} payment{detailPayments.length!==1?'s':''} · {fmt(detailPayments.reduce((s,p)=>s+p.amount,0))}
          </div>
        </div>

        {detailPayments.length===0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--slate-muted)',fontSize:14}}>
            No payments recorded yet for this period.
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'var(--slate-faint)',borderBottom:'1px solid var(--slate-border)'}}>
                {['Date','Client','Invoice #','Amount','Method','Reference','Note'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'var(--slate-muted)',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detailPayments.map((p,i)=>(
                <tr key={p.id||i} style={{borderBottom:i<detailPayments.length-1?'1px solid var(--slate-faint)':'none'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFAFA'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'12px 14px',fontSize:13,color:'var(--slate-muted)',whiteSpace:'nowrap'}}>{p.date}</td>
                  <td style={{padding:'12px 14px'}}>
                    <div style={{fontWeight:600,fontSize:13}}>{p.clientName}</div>
                    <div style={{fontSize:11,color:'var(--slate-muted)'}}>{p.clientEmail}</div>
                  </td>
                  <td style={{padding:'12px 14px',fontSize:13,fontWeight:600,color:'var(--forest)',whiteSpace:'nowrap'}}>{p.invoiceNumber}</td>
                  <td style={{padding:'12px 14px',fontWeight:700,fontSize:14,color:'var(--forest)',whiteSpace:'nowrap'}}>{fmt(p.amount)}</td>
                  <td style={{padding:'12px 14px'}}>
                    <span style={{padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:'var(--forest-faint)',color:'var(--forest)',border:'1px solid var(--forest-pale)'}}>
                      {METHOD_LABEL[p.method]||p.method}
                    </span>
                  </td>
                  <td style={{padding:'12px 14px',fontSize:12,color:'var(--slate-muted)'}}>{p.reference||'—'}</td>
                  <td style={{padding:'12px 14px',fontSize:12,color:'var(--slate-muted)'}}>{p.note||'—'}</td>
                </tr>
              ))}
            </tbody>
            {/* Totals footer */}
            <tfoot>
              <tr style={{background:'var(--forest-faint)',borderTop:'2px solid var(--forest-pale)'}}>
                <td colSpan={3} style={{padding:'11px 14px',fontWeight:700,fontSize:13,color:'var(--forest)'}}>Total</td>
                <td style={{padding:'11px 14px',fontWeight:800,fontSize:15,color:'var(--forest)'}}>{fmt(detailPayments.reduce((s,p)=>s+p.amount,0))}</td>
                <td colSpan={3}/>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

function BigStat({label,value,sub,accent}) {
  return (
    <div style={{
      background:accent?'var(--forest)':'white',borderRadius:12,
      padding:'1.1rem 1.3rem',border:`1px solid ${accent?'transparent':'var(--slate-border)'}`,
    }}>
      <div style={{fontSize:11,color:accent?'rgba(255,255,255,0.65)':'var(--slate-muted)',fontWeight:600,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</div>
      <div style={{fontSize:20,fontWeight:800,color:accent?'white':'var(--slate)'}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:accent?'rgba(255,255,255,0.55)':'var(--slate-muted)',marginTop:3}}>{sub}</div>}
    </div>
  )
}
