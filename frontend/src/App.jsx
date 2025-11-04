import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h1>SpendSense</h1>
              <p>Financial Insights Platform</p>
              <p>Frontend is running on port 3000</p>
            </div>
          } />
        </Routes>
      </Router>
    </div>
  )
}

export default App

