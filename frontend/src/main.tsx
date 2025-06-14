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


const App = () => (
  <Theme>
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


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
