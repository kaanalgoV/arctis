import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: any) {
    console.error('ARCTIS CRASH:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{color:'#ff4466',padding:40,fontFamily:'monospace',fontSize:14,background:'#0A0D12',minHeight:'100vh'}}>
          <h2 style={{color:'#EF4136',marginBottom:16}}>Arctis Error</h2>
          <pre style={{whiteSpace:'pre-wrap',color:'#949DA8'}}>{this.state.error.message}</pre>
          <pre style={{whiteSpace:'pre-wrap',color:'#6E7681',marginTop:8,fontSize:11}}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch(e: any) {
  document.getElementById('root')!.innerHTML = `<pre style="color:red;padding:40px">${e.message}\n${e.stack}</pre>`
}
