// Import polyfills first
import './polyfills';

import { ClerkProvider } from '@clerk/clerk-react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {Provider} from "react-redux";
import { applyMiddleware,compose } from 'redux';
import {legacy_createStore as createstore} from "redux"
import {thunk} from "redux-thunk"
import Reducers from './Reducers';
import { ThemeProvider } from './context/ThemeContext';
import LocationBasedAuth from './components/LocationBasedAuth';

const darkTheme = {
    general: {
        backgroundColor: '#202124',
        color: '#ffffff',
    },
    elements: {
        formButtonPrimary: {
            backgroundColor: '#8ab4f8',
            color: '#202124',
        },
        card: {
            backgroundColor: '#303134',
            boxShadow: 'none',
        },
        headerTitle: {
            color: '#ffffff',
        },
        headerSubtitle: {
            color: '#bdc1c6',
        },
        formFieldInput: {
            backgroundColor: '#303134',
            borderColor: '#5f6368',
            color: '#ffffff',
        },
        formFieldLabel: {
            color: '#bdc1c6',
        },
        footer: {
            color: '#bdc1c6',
        },
    },
};

const store = createstore(Reducers,compose(applyMiddleware(thunk)));
const root = ReactDOM.createRoot(document.getElementById('root'));

if (!process.env.REACT_APP_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

root.render(
  <Provider store={store}>
    <ClerkProvider
      publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: darkTheme,
        variables: {
          colorPrimary: '#8ab4f8',
          colorBackground: '#202124',
          colorText: '#ffffff',
          colorTextSecondary: '#bdc1c6',
        },
      }}
    >
      <ThemeProvider>
        <LocationBasedAuth />
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </ThemeProvider>
    </ClerkProvider>
  </Provider>
);







