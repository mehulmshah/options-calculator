/* app.ts
 * This is the main file of the backend. It defines all endpoints and any
 * attributes necessary.
 */

var express = require("express");
var helmet = require("helmet");
var axios = require("axios");
var path = require("path");

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

app.get("/stock", async function (req, res) {
  const YAHOO_API_PRICE_URL =
    "https://query2.finance.yahoo.com/v8/finance/chart/";
  let ticker = req.query.ticker;
  axios
    .get(YAHOO_API_PRICE_URL + ticker)
    .then((response) => {
      res.status(200);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("There was an error: ", err);
      return { err: err };
    });
});

app.get("/option", async function (req, res) {
  const YAHOO_API_OPTIONS_URL =
    "https://query2.finance.yahoo.com/v7/finance/options/";
  let ticker = req.query.ticker;
  let expiration = req.query.exp ? "?date=" + req.query.exp : "";
  const fullUrl = axios
    .get(YAHOO_API_OPTIONS_URL + ticker + expiration)
    .then((response) => {
      res.status(200);
      res.send(response.data);
    })
    .catch((err) => {
      console.log("There was an error: ", err);
      return { err: err };
    });
});

app.get("/test", async function (req, res) {
  res.status(200);
  res.send("This is a test");
});

// All other routes are authenticated & served from static files
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
} else {
  app.get(
    "*",
    require("http-proxy-middleware").createProxyMiddleware({
      target: "http://localhost:3001/",
      changeOrigin: true,
    })
  );
}

module.exports = app;
