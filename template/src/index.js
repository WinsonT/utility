import React from "react";
import ReactDOM from "react-dom";
import { configureStore } from '../src/store';
import { HashRouter as Router } from 'react-router-dom';
import { createHashHistory } from "history";
import Home from './components/Home';
const store = configureStore()
const { Provider } = require('react-redux');
const history = createHashHistory()

ReactDOM.render(
    <Provider store={store}>
        <Router history={history}>
            <Home />
        </Router>
    </Provider>,
    document.getElementById('root'));
