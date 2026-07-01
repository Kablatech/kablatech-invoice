import React, { useState } from 'react'
import LOGO from '../assets/logo.js'

// ── Credentials (change these to whatever you want) ──────────────────────────
const USERS = [
  { username: 'kablat',    password: 'Om.,LA3902', role: 'Admin'    },
  { username: 'kablatech', password: 'zeemZAH3902',  role: 'Staff'    },
]
// ─────────────────────────────────────────────────────────────────────────────

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = USERS.find(
        u => u.username === username.trim().toLowerCase() && u.password === password
      )
      if (user) {
        sessionStorage.setItem('kbl_user', JSON.stringify({ username: user.username, role: user.role }))
        onLogin(user)
      } else {
        setError('Incorrect username or password.')
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0D1B4B 0%, #1B4332 50%, #0D1B4B 100%)',
      padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width:  [300,200,400,150,250,350][i],
            height: [300,200,400,150,250,350][i],
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.05)',
            top:  ['10%','60%','-10%','70%','30%','80%'][i],
            left: ['70%','10%','30%','80%','-5%','55%'][i],
          }} />
        ))}
        {/* Glowing orbs */}
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(231,111,0,0.08)', top:'-100px', right:'-100px', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(27,67,50,0.4)',   bottom:'-80px', left:'-80px',  filter:'blur(50px)' }} />
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: 20,
        padding: '2.5rem 2.5rem', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={LOGO} alt="KablaTech" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 12 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0D1B4B', letterSpacing: '-0.5px' }}>
            KablaTech Solutions
          </h1>
          <p style={{ fontSize: 13, color: '#6B6B6E', marginTop: 4 }}>Invoice Management System</p>
          <div style={{
            display: 'inline-block', marginTop: 10,
            padding: '3px 14px', borderRadius: 20,
            background: 'linear-gradient(90deg, #1B4332, #2D6A4F)',
            fontSize: 11, fontWeight: 600, color: 'white', letterSpacing: '0.05em'
          }}>SECURE LOGIN</div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #D1D1D6, transparent)', marginBottom: '1.75rem' }} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={iconStyle}>👤</span>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username" required autoFocus
                style={{ ...inputStyle, paddingLeft: 42 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={iconStyle}>🔒</span>
              <input
                type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required
                style={{ ...inputStyle, paddingLeft: 42, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: 4,
              }}>{showPwd ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, background: '#FFF0EE',
              border: '1px solid #F09595', color: '#C0392B', fontSize: 13,
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            }}>⚠️ {error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #1B4332, #2D6A4F)',
            color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em',
            boxShadow: loading ? 'none' : '0 4px 15px rgba(27,67,50,0.35)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #D1D1D6, transparent)', marginBottom: 14 }} />
          <p style={{ fontSize: 11, color: '#9B9B9E' }}>
            🔐 Protected system · KablaTech Solutions © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#3A3A3C',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
}
const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #D1D1D6',
  borderRadius: 9, background: '#FAFAF7', fontSize: 14, color: '#1C1C1E',
}
const iconStyle = {
  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
  fontSize: 15, pointerEvents: 'none',
}
