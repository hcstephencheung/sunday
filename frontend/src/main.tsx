import './main.css';
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Route, Switch } from "wouter";
import {
  FourOhFourPage,
  CsvPage
} from './pages';

export type DarkModeContextType = {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
};

export const DarkModeContext = React.createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
  const context = React.useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = React.useState(false);
  const value = React.useMemo(() => ({ darkMode, setDarkMode }), [darkMode]);
  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
}

const AppWithTheme = () => {
  const hour = new Date().getHours();
  const isDarkMode = (hour >= 7 && hour < 20) ? false : true;
  const { darkMode } = useDarkMode();
  const [appearance, setAppearance] = React.useState(isDarkMode ? 'dark' : 'light');
  const [accentColor, setAccentColor] = React.useState(isDarkMode ? 'jade' : 'indigo');
  const [grayColor, setGrayColor] = React.useState(isDarkMode ? 'gray' : 'slate');

  React.useEffect(() => {
    if (darkMode) {
      setAppearance('dark');
      setAccentColor('jade');
      setGrayColor('gray');
    } else {
      setAppearance('light');
      setAccentColor('indigo');
      setGrayColor('slate');
    }
  }, [darkMode]);

  return (
    <Theme grayColor={grayColor} accentColor={accentColor} panelBackground="translucent" appearance={appearance}>
      <Switch>
        <Route path="/" component={CsvPage} />
        {/* Default route in a switch */}
        <Route>
          <FourOhFourPage />
        </Route>
      </Switch>
    </Theme>
  )
}

const App = () => {
  return (
    <DarkModeProvider>
      <AppWithTheme />
    </DarkModeProvider>
  )
}


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
