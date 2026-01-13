import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'antd/dist/reset.css'
import './global.css';
import { AppThemeProvider } from "./layout/AppThemeProvider.jsx"; 

createRoot(document.getElementById('root')).render(
   <StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </StrictMode>,
)
