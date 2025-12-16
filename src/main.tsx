import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TranslationProvider } from './shared/contexts/TranslationContext'
import { ThemeProvider } from './shared/contexts/ThemeContext'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <TranslationProvider>
                    <App />
                </TranslationProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
)
