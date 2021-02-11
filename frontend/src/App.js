/* App.tsx
 * This file renders the BomBuilder application. Some overall components are
 * initialized here, like the SnackbarProvider, BackendHealth, and others.
 * There are also hotkeys to upload a file of packages / druid locks.
 * We can see the endpoints are routed into components here, such that the
 * index endpoint (/) renders <CreateProject />, and a specific job endpoint
 * (/job/<job_id>) renders <JobView />
 */

import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createMuiTheme, Theme, ThemeProvider } from "@material-ui/core/styles";
import { SnackbarProvider } from "notistack";
import { Route, Switch } from "react-router";
import { BrowserRouter } from "react-router-dom";
import DashboardView from "./DashboardView";
import HeaderBar from "./HeaderBar";

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme: Theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: "dark",
          primary: {
            light: "#A9FF8B",
            main: "#00C805",
            dark: "#009000",
          },
          secondary: {
            light: "#FFFFFF",
            main: "#FFFFFF",
            dark: "#E2E2E2",
          },
          error: {
            main: "#FF5000",
            light: "#FF50001A",
          },
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        maxSnack={2}
      >
        <HeaderBar />
        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <DashboardView />
            </Route>
          </Switch>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
