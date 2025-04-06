import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { FirebaseContextProvider } from './contexts/FirebaseContext';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './components/Auth/Login';
import DataList from './components/Firestore/DataList';
import FileUpload from './components/Storage/FileUpload';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

const App = () => {
  return (
    <FirebaseContextProvider>
      <Router>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/profile" component={Profile} />
          <Route path="/login" component={Login} />
          <Route path="/data" component={DataList} />
          <Route path="/upload" component={FileUpload} />
        </Switch>
      </Router>
    </FirebaseContextProvider>
  );
};

export default App;