import './main.css';
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Route, Switch } from "wouter";
import {
  FourOhFourPage,
  OcrPage,
  CsvPage
} from './pages';


const App = () => {
  const hour = new Date().getHours();
  const isDarkMode = (hour >= 7 && hour < 20) ? false : true;
  const appearance = isDarkMode ? 'dark' : 'light';
  const accentColor = isDarkMode ? 'jade' : 'indigo';
  const grayColor = isDarkMode ? 'sage' : 'gray';

  return (
    <Theme grayColor={grayColor} accentColor={accentColor} panelBackground="translucent" appearance={appearance}>
      <Switch>
        <Route path="/" component={CsvPage} />
        <Route path="/ocr" component={OcrPage} />

        {/* Default route in a switch */}
        <Route>
          <FourOhFourPage />
        </Route>
      </Switch>
    </Theme>
  )
}


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
