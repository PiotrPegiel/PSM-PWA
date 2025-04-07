import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './components/Auth/Login';
import DataList from './components/Firestore/DataList';
import FileUpload from './components/Storage/FileUpload';
import Register from './components/Auth/Register';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

const App = () => {
  const { currentUser } = useFirebase() || {};

  return (
    <FirebaseProvider>
      <Router>
        <Switch>
          <Route exact path="/">
            {currentUser ? <Home /> : <Redirect to="/login" />}
          </Route>
          <Route path="/profile" component={Profile} />
          <Route path="/home" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/data" component={DataList} />
          <Route path="/upload" component={FileUpload} />
          <Route path="/register" component={Register} />
        </Switch>
      </Router>
    </FirebaseProvider>
  );
};

export default App;