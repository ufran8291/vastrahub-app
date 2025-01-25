import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import AppWithProvider from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <AppWithProvider />
    <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={true}
    newestOnTop={true}
    closeOnClick
    // rtl={false}
    // pauseOnFocusLoss
    draggable
    // pauseOnHoverd
    theme="dark"

    />
  </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
