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
import { DarkModeProvider, useDarkMode } from './components/DarkMode';

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
