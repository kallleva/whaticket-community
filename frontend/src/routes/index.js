import React from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import LoggedInLayout from "../layout";
import Dashboard from "../pages/Dashboard/";
import Tickets from "../pages/Tickets/";
import Signup from "../pages/Signup/";
import Login from "../pages/Login/";
import Connections from "../pages/Connections/";
import Settings from "../pages/Settings/";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts/";
import QuickAnswers from "../pages/QuickAnswers/";
import Queues from "../pages/Queues/";
import Reminders from "../pages/Reminders/";
import Birthdays from "../pages/Birthdays/";
import Flows from "../pages/Flows/";
import FlowEditor from "../pages/FlowEditor/";
import AiSettings from "../pages/AiSettings/";
import Agents from "../pages/Agents/";
import Vehicles from "../pages/Vehicles/";
import TestDrives from "../pages/TestDrives/";
import { AuthProvider } from "../context/Auth/AuthContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import { ThemeProvider } from "../context/DarkMode";
import Route from "./Route";

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Switch>
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <WhatsAppsProvider>
              <LoggedInLayout>
                <Route exact path="/" component={Dashboard} isPrivate />
                <Route exact path="/tickets/:ticketId?" component={Tickets} isPrivate />
                <Route exact path="/connections" component={Connections} isPrivate />
                <Route exact path="/contacts" component={Contacts} isPrivate />
                <Route exact path="/users" component={Users} isPrivate />
                <Route exact path="/quickAnswers" component={QuickAnswers} isPrivate />
                <Route exact path="/Settings" component={Settings} isPrivate />
                <Route exact path="/Queues" component={Queues} isPrivate />
                <Route exact path="/reminders" component={Reminders} isPrivate />
                <Route exact path="/birthdays" component={Birthdays} isPrivate />
                <Route exact path="/flows" component={Flows} isPrivate />
                <Route exact path="/flows/:flowId" component={FlowEditor} isPrivate />
                <Route exact path="/ai-settings" component={AiSettings} isPrivate />
                <Route exact path="/agents" component={Agents} isPrivate />
                <Route exact path="/vehicles" component={Vehicles} isPrivate />
                <Route exact path="/test-drives" component={TestDrives} isPrivate />
              </LoggedInLayout>
            </WhatsAppsProvider>
          </Switch>
          <ToastContainer autoClose={3000} />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
