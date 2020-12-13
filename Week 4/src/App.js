import React from "react";
import { ROUTES } from "./consts";
import { Switch, Route, Redirect } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Home from "./components/Home/Home";
import Create from "./components/Create/Create";
import World from "./components/World/World";
import Pin from "./components/Pin/Pin";


function App() {
  const location = useLocation();
  let x;
  let name;
  if (location.state) {
    if (location.state.x) {
      x = location.state.x;
    }
  }
  if (location.state) {
    if (location.state.name) {
      name = location.state.name;
    }
  }
  return (
    <>
      <Switch>
        <Route exact path={ROUTES.world}>
        {name ? <World /> : <Redirect to={ROUTES.home} />}
        </Route>
        <Route exact path={ROUTES.create}>
          {x ? <Create /> : <Redirect to={ROUTES.world} />}
        </Route>
        <Route path={ROUTES.pins.path}>
          <Pin />
        </Route>
        <Route path={ROUTES.home}>
          <>
            <Home />
          </>
        </Route>
      </Switch>
    </>
  );
}

export default App;
