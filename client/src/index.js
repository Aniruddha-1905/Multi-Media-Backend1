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
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
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

const whiteTheme = {
    general: {
        backgroundColor: '#ffffff',
        color: '#000000',
    },
    elements: {
        formButtonPrimary: {
            backgroundColor: '#1a73e8',
            color: '#ffffff',
        },
        card: {
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        headerTitle: {
            color: '#000000',
        },
        headerSubtitle: {
            color: '#5f6368',
        },
        formFieldInput: {
            backgroundColor: '#ffffff',
            borderColor: '#dadce0',
            color: '#000000',
        },
        formFieldLabel: {
            color: '#5f6368',
        },
        footer: {
            color: '#5f6368',
        },
    },
};

const store = createstore(Reducers,compose(applyMiddleware(thunk)));
const root = ReactDOM.createRoot(document.getElementById('root'));

if (!process.env.REACT_APP_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// Create a component that wraps ClerkProvider with theme awareness
const ThemedApp = () => {
  const [currentTheme, setCurrentTheme] = React.useState('dark');

  // Function to update Clerk theme based on our app theme
  const updateClerkTheme = (isWhite) => {
    setCurrentTheme(isWhite ? 'white' : 'dark');
  };

  return (
    <ClerkProvider
      publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: currentTheme === 'white' ? whiteTheme : darkTheme,
        variables: currentTheme === 'white' ? {
          colorPrimary: '#1a73e8',
          colorBackground: '#ffffff',
          colorText: '#000000',
          colorTextSecondary: '#5f6368',
        } : {
          colorPrimary: '#8ab4f8',
          colorBackground: '#202124',
          colorText: '#ffffff',
          colorTextSecondary: '#bdc1c6',
        },
      }}
    >
      <ThemeProvider>
        <LocationBasedAuth />
        <ThemeListener onThemeChange={updateClerkTheme} />
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </ThemeProvider>
    </ClerkProvider>
  );
};

// Component to listen for theme changes
const ThemeListener = ({ onThemeChange }) => {
  const { isWhiteTheme } = React.useContext(ThemeContext);

  React.useEffect(() => {
    onThemeChange(isWhiteTheme);
  }, [isWhiteTheme, onThemeChange]);

  return null;
};

root.render(
  <Provider store={store}>
    <ThemedApp />
  </Provider>
);







