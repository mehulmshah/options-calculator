/* app.ts
 * This is the main file of the backend. It defines all endpoints and any
 * attributes necessary.
 */

import express from "express";
import helmet from "helmet";
import OK from "http-status-codes";
import path from "path";
import createProxyMiddleware from "http-proxy-middleware";
import axios from "axios";

// Declare Express app
const app = express();

app.use(express.json());

// Configure helmet
app.use(helmet());

// Configure Session

// OIDC Auth endpoints
app.get("/login", function (req, res) {
  res.status(OK).send("Login Successful");
});

const YAHOO_API_OPTIONS_URL = 'https://query2.finance.yahoo.com/v7/finance/options/';
const YAHOO_API_PRICE_URL = 'https://query2.finance.yahoo.com/v8/finance/chart/';

app.get("/stock", async function (req, res) {
  let ticker = req.query.ticker;
  axios.get(YAHOO_API_PRICE_URL + ticker)
    .then(response => {
      console.log(response);
      return response
    })
    .catch(err => {
      console.log('There was an error: ', err);
      return {'err': 'test err'}
    });
});

app.get("/test", async function (req, res) {
  res.status(200);
  res.send('This is a test');
});

// All other routes are authenticated & served from static files
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
} else {
  app.get(
    "*",
    createProxyMiddleware({
      target: "http://localhost:3001/",
      changeOrigin: true,
    })
  );
}

export default app;
