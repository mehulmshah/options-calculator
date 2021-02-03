/* DashboardView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TableCell,
  TableRow,
  TextField,
  Theme,
  Typography
} from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import LibraryAddCheckRoundedIcon from '@material-ui/icons/LibraryAddCheckRounded';
import SendIcon from "@material-ui/icons/Send";
import { FixedSizeList as List } from 'react-window';
import { useSnackbar } from "notistack";
import moment from "moment";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: 600,
    margin: theme.spacing(1),
    marginTop: 50,
  },
  close: {
    padding: theme.spacing(0.5),
  },
  card: {
    width: "70vw",
    cursor: "pointer",
    margin: theme.spacing(1),
  },
  dialog: {
    margin: theme.spacing(1),
  },
  icon: {
    color: theme.palette.primary.main,
    width: 40,
    height: 40,
  },
  leftSide: {
    marginLeft: "auto",
  },
  tickerGain: {
    color: theme.palette.primary.dark,
  },
  tickerLoss: {
    color: "red",
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 250,
  },
  buttonGroup: {
    width: "100%"
  }
}));

const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
const YAHOO_API_OPTIONS_URL = 'https://query2.finance.yahoo.com/v7/finance/options/';
const YAHOO_API_PRICE_URL = 'https://query2.finance.yahoo.com/v8/finance/chart/';
const STATUS_OK = 200;

function DashboardView() {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();

  const [contactUs, setContactUs] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [expiration, setExpiration] = React.useState("");
  const [expirationDates, setExpirationDates] = React.useState([0]);
  const [symbol, setSymbol] = React.useState("AAPL");
  const [symbolPriceData, setSymbolPriceData] = React.useState({price: 0, diff: 0});
  const [optionChain, setOptionChain] = React.useState({calls: [0], puts: [0]});
  const [buyOrSell, setBuyOrSell] = React.useState("buy");
  const [callsOrPuts, setCallsOrPuts] = React.useState("calls");
  const handleSubmitContact = () => {
    enqueueSnackbar("Request successfully submitted", {variant: "success"});
    return;
  };

  const handleSymbolLookup = async () => {
    enqueueSnackbar(`Looking up ${symbol}`, {variant: "info"});
    getStockPrice();
    getOptionChain();
  };

  const getStockPrice = () => {
    fetch(PROXY_URL + YAHOO_API_PRICE_URL + symbol.toLowerCase(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => {
        if (response.status === STATUS_OK) {
          enqueueSnackbar("Successfully Loaded Price", {variant: "success"});
        }
        return response.json();
      })
      .then(data => {
        console.log(data);
        let currPrice = data.chart.result[0].meta.regularMarketPrice;
        let prevClose = data.chart.result[0].meta.previousClose;
        setSymbolPriceData({
          price: currPrice.toFixed(2),
          diff: prevClose - currPrice,
        });
      })
      .catch(err => {
        console.log('There was an error: ', err);
        enqueueSnackbar(`Error searching for ${symbol.toUpperCase()} price`,
                        {variant: 'error'});
      });
  };

  const getOptionChain = () => {
    fetch(PROXY_URL + YAHOO_API_OPTIONS_URL + symbol.toLowerCase(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => {
        if (response.status === STATUS_OK) {
          enqueueSnackbar("Successfully Loaded OptChain", {variant: "success"});
        }
        return response.json();
      })
      .then(data => {
        let optionsJson = data.optionChain.result[0].options[0];
        let expirationDates = data.optionChain.result[0].expirationDates;
        console.log(optionsJson);
        setOptionChain({
          calls: optionsJson.calls,
          puts: optionsJson.puts,
        });
        setExpiration(expirationDates[0]);
        setExpirationDates(expirationDates);
      })
      .catch(err => {
        console.log('There was an error: ', err);
        enqueueSnackbar(`Error searching for ${symbol.toUpperCase()} options`,
                        {variant: 'error'});
      });
  };

  const displayCallOptions = () => {
    let callOpts = optionChain.calls;
    console.log(callOpts);
    return callOpts.map((call) => {
      return (
        <Grid item key={call.contractSymbol}>
          <div>call.strike</div>
        </Grid>
      );
    });
  };

  return (
    <Grid className={classes.root}>
      <Grid container justify="center">
        <Grid item>
          <Card
            className={classes.card}
          >
            <CardHeader
              className={classes.cardHeader}
              avatar={<LibraryAddCheckRoundedIcon className={classes.icon}/>}
              titleTypographyProps={{variant:'h5', fontStyle: 'bold'}}
              title="Options Calculator"
              subheader="Democratize Earnings"
            />
            <CardContent>
              {(symbolPriceData.price !== 0 && optionChain.calls.length > 0) ? (
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12}>
                    <Typography className={classes.dialog}>
                      {symbol.toUpperCase() + " "}
                      <span className={symbolPriceData.diff > 0 ? classes.tickerLoss : classes.tickerGain}>
                        ${symbolPriceData.price}
                      </span>
                    </Typography>
                  </Grid>
                  <Grid item>
                    <ButtonGroup className={classes.buttonGroup}>
                      <Button color="primary"
                        onClick={(e) => setBuyOrSell("buy")}
                        variant={buyOrSell === "buy" ? "contained" : "outlined"}
                        className={classes.buttonGroup}
                      >
                        Buy
                      </Button>
                      <Button color="primary"
                        onClick={(e) => setBuyOrSell("sell")}
                        variant={buyOrSell === "sell" ? "contained" : "outlined"}
                        className={classes.buttonGroup}
                      >
                        Sell
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item>
                    <ButtonGroup className={classes.buttonGroup}>
                      <Button color="primary"
                        onClick={(e) => setCallsOrPuts("calls")}
                        variant={callsOrPuts === "calls" ? "contained" : "none"}
                        className={classes.buttonGroup}
                      >
                        Calls
                      </Button>
                      <Button color="primary"
                        onClick={(e) => setCallsOrPuts("puts")}
                        variant={callsOrPuts === "puts" ? "contained" : "text"}
                        className={classes.buttonGroup}
                      >
                        Puts
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item>
                    <FormControl variant="outlined" className={classes.formControl}>
                      <InputLabel id="demo-simple-select-outlined-label">Expiration</InputLabel>
                      <Select
                        labelId="demo-simple-select-outlined-label"
                        id="demo-simple-select-outlined"
                        value={expiration}
                        onChange={(e) => setExpiration(e.target.value)}
                        label="Expiration"
                      >
                        {expirationDates.map((exp) => {
                          let date = moment.unix(exp).utc();
                          let format = date.year() === moment().year() ?
                            "MMMM Do" : "MMMM Do, YYYY"
                          return (
                            <MenuItem value={exp}>{date.format(format)}</MenuItem>
                          )
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={10}>
                    <List
                      height={200}
                      itemSize={200}
                    >
                      {displayCallOptions()}
                    </List>
                  </Grid>
                </Grid>
                ) : (
                <Grid container justify="center">
                  <Grid item xs={4}>
                    <TextField
                      className={classes.enterTicker}
                      label="Symbol Lookup"
                      placeholder="AAPL, GME, etc."
                      helperText="Enter a stock ticker"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      fullWidth={true}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                className={classes.leftSide}
                onClick={handleSymbolLookup}
                disabled={symbol === ""}
              >
                Show Options
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      <Dialog open={contactUs} fullWidth maxWidth="sm" className={classes.dialog}>
        <DialogTitle>Need Help?</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name"
            variant="outlined"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setName(event.target.value);
            }}
            value={name}
          />
          <TextField
            label="Email"
            variant="outlined"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(event.target.value);
            }}
            value={email}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleSubmitContact}
            endIcon={<SendIcon />}
          >
            Submit
          </Button>
          <Button variant="outlined" onClick={() => setContactUs(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default DashboardView;
