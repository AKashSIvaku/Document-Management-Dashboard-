import React, { useEffect, useState } from 'react'

export default function App() {
  const [msg, setMsg] = useState('loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then((r) => r.text())
      .then((t) => setMsg(t))
      .catch(() => setMsg('Backend not available'))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Document Management Dashboard</h1>
      <p>Backend says: {msg}</p>
    </div>
  )
}
