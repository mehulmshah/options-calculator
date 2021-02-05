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
  Paper,
  Select,
  Slider,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Typography,
} from "@material-ui/core";
import LibraryAddCheckRoundedIcon from "@material-ui/icons/LibraryAddCheckRounded";
import SendIcon from "@material-ui/icons/Send";
import { useSnackbar } from "notistack";
import moment from "moment";
import axios from "axios";
import blackScholes from "black-scholes";
import greeks from "greeks";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const GainColor = "#00C805";
const LossColor = "#FF5000";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: 600,
    margin: theme.spacing(1),
    marginTop: 50,
  },
  bold: {
    fontWeight: "bold",
  },
  close: {
    padding: theme.spacing(0.5),
  },
  card: {
    width: "80vw",
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
  ticker: {
    color: ({ gainOrLoss }) => gainOrLoss,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 250,
  },
  selected: {
    backgroundColor: ({ gainOrLoss }) => gainOrLoss,
    color: "white",
    width: "100%",
    "&:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss,
      color: "white",
    },
  },
  unSelected: {
    width: "100%",
    backgroundColor: ({ gainOrLoss }) => gainOrLoss + "1A",
    color: ({ gainOrLoss }) => gainOrLoss,
    "&:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss + "4D",
    },
  },
  tableRowLightMode: {
    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss + "1A",
      color: "white",
    },
  },
  table: {
    width: "100%",
    maxHeight: 400,
  },
  test: {
    backgroundColor: ({ gainOrLoss }) => gainOrLoss,
    "&:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss,
    },
  },
}));

const STATUS_OK = 200;

function DashboardView() {
  const { enqueueSnackbar } = useSnackbar();

  const [contactUs, setContactUs] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [expiration, setExpiration] = React.useState("");
  const [expirationDates, setExpirationDates] = React.useState([0]);
  const [symbol, setSymbol] = React.useState("AAPL");
  const [symbolPrice, setSymbolPrice] = React.useState(0);
  const [optionChain, setOptionChain] = React.useState({
    calls: [0],
    puts: [0],
  });
  const [chosenOptionChain, setChosenOptionChain] = React.useState([0]);
  const [buyOrSell, setBuyOrSell] = React.useState("buy");
  const [callsOrPuts, setCallsOrPuts] = React.useState("call");
  const [selectedOption, setSelectedOption] = React.useState(0);
  const [gainOrLoss, setGainOrLoss] = React.useState(GainColor);

  const classes = useStyles({ gainOrLoss });

  const handleSubmitContact = () => {
    enqueueSnackbar("Request successfully submitted", { variant: "success" });
    return;
  };

  const handleSymbolLookup = async () => {
    enqueueSnackbar(`Looking up ${symbol}`, { variant: "info" });
    getStockPrice();
    getOptionChain();
  };

  const getStockPrice = async () => {
    axios
      .get("/stock?ticker=" + symbol.toLowerCase())
      .then((response) => {
        if (response.status === STATUS_OK) {
          enqueueSnackbar("Successfully Loaded Stock Price", {
            variant: "success",
          });
          let currPrice = response.data.chart.result[0].meta.regularMarketPrice;
          let prevPrice = response.data.chart.result[0].meta.chartPreviousClose;
          setSymbolPrice(currPrice);
          setGainOrLoss(currPrice - prevPrice > 0 ? GainColor : LossColor);
        }
      })
      .catch((error) => {
        console.log(error);
        enqueueSnackbar(`Error searching for ${symbol.toUpperCase()} price`, {
          variant: "error",
        });
      });
  };

  const getOptionChain = React.useCallback(
    (exp = "") => {
      let endpoint = "/option?ticker=" + symbol.toLowerCase();
      if (exp !== "") {
        endpoint += "&exp=" + exp;
      }
      axios
        .get(endpoint)
        .then((response) => {
          if (response.status === STATUS_OK) {
            enqueueSnackbar("Successfully Loaded Option Chain", {
              variant: "success",
            });
            let optionsJson = response.data.optionChain.result[0].options[0];
            let expirationDates =
              response.data.optionChain.result[0].expirationDates;
            setOptionChain({
              calls: optionsJson.calls,
              puts: optionsJson.puts,
            });
            setChosenOptionChain(optionsJson.calls);
            if (exp === "") {
              setExpiration(expirationDates[0]);
            }
            setExpirationDates(expirationDates);
          }
        })
        .catch((error) => {
          console.log(error);
          enqueueSnackbar(
            `Error searching for ${symbol.toUpperCase()} options`,
            {
              variant: "error",
            }
          );
        });
    },
    [enqueueSnackbar, symbol]
  );

  React.useEffect(() => {
    if (expiration !== "") {
      getOptionChain(expiration);
    }
  }, [expiration, getOptionChain]);

  const displayCallOptions = () => {
    return chosenOptionChain
      .filter((call) => call)
      .map((call) => {
        let sign = call.percentChange > 0 ? "+" : "-";
        return (
          <TableRow
            item
            key={call.contractSymbol}
            selected={call.strike === selectedOption}
            onClick={() => setSelectedOption(call.strike)}
            className={classes.tableRowLightMode}
          >
            <TableCell className={classes.bold}>${call.strike}</TableCell>
            <TableCell>${(call.strike + call.lastPrice).toFixed(2)}</TableCell>
            <TableCell>
              {sign + Math.abs(call.percentChange).toFixed(2)}%
            </TableCell>
            <TableCell>
              {sign}${Math.abs(call.change).toFixed(2)}
            </TableCell>
            <TableCell>
              <Button
                className={classes.test}
                variant={
                  call.strike === selectedOption ? "contained" : "outlined"
                }
              >
                ${call.lastPrice.toFixed(2)}
              </Button>
            </TableCell>
          </TableRow>
        );
      });
  };

  const testBS = () => {
    let option = chosenOptionChain.find(
      (call) => call.strike === selectedOption
    );
    let timeDiff =
      (moment().diff(moment.unix(option.expiration).utc(), "days") + 1) / 365;
    let output = blackScholes.blackScholes(
      symbolPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.08,
      callsOrPuts
    );

    let delta = greeks.getDelta(
      symbolPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.08,
      callsOrPuts
    );
    let gamma = greeks.getGamma(
      symbolPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.08
    );
    let theta = greeks.getTheta(
      symbolPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.08,
      callsOrPuts
    );
    return (
      <div>
        <div>Price: {output}</div>
        <div>Delta: {delta}</div>
        <div>Gamma: {gamma}</div>
        <div>Theta: {theta}</div>
      </div>
    );
  };

  const generateChart = () => {
    let today = moment();
    let days = [];
    days.push(today.format());
    let timeDiff =
      Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1;
    for (let i = 1; i < timeDiff; i++) {
      let d = today.clone().add(i, "days");
      days.push(d.format());
    }
    let option = chosenOptionChain.find(
      (call) => call.strike === selectedOption
    );
    if (!option) {
      return;
    }
    let data = [];
    days.forEach((d) => {
      let tempObj = {};
      let timeDiffInYears =
        (Math.abs(moment(d).diff(moment.unix(expiration).utc(), "days")) + 1) /
        365;
      let output = blackScholes.blackScholes(
        symbolPrice,
        option.strike,
        timeDiffInYears,
        option.impliedVolatility,
        0.08,
        callsOrPuts
      );
      tempObj.date = d;
      tempObj.price = output;
      data.push(tempObj);
    });
    return (
      <LineChart width={600} height={500} data={data}>
        <Line type="monotone" dataKey="price" stroke="#8884d8" />
        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
        <XAxis dataKey="date" />
        <YAxis dataKey="price" />
        <Tooltip />
      </LineChart>
    );
  };

  return (
    <Grid className={classes.root}>
      <Grid container justify="center">
        <Grid item>
          <Card className={classes.card}>
            <CardHeader
              className={classes.cardHeader}
              avatar={<LibraryAddCheckRoundedIcon className={classes.icon} />}
              titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
              title="Options Calculator"
              subheader="Democratize Earnings"
            />
            <CardContent>
              {symbolPrice !== 0 && chosenOptionChain.length > 0 ? (
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12}>
                    <Typography className={classes.dialog}>
                      {symbol.toUpperCase() + " "}
                      <span className={classes.ticker}>
                        ${symbolPrice.toFixed(2)}
                      </span>
                    </Typography>
                  </Grid>
                  <Grid item>
                    <ButtonGroup>
                      <Button
                        color="inherit"
                        onClick={(e) => setBuyOrSell("buy")}
                        variant={"outlined"}
                        className={
                          buyOrSell === "buy"
                            ? classes.selected
                            : classes.unSelected
                        }
                      >
                        Buy
                      </Button>
                      <Button
                        color="inherit"
                        onClick={(e) => setBuyOrSell("sell")}
                        variant={"outlined"}
                        className={
                          buyOrSell === "sell"
                            ? classes.selected
                            : classes.unSelected
                        }
                      >
                        Sell
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item>
                    <ButtonGroup className={classes.buttonGroup}>
                      <Button
                        color="inherit"
                        onClick={(e) => {
                          setCallsOrPuts("call");
                          setChosenOptionChain(optionChain.calls);
                        }}
                        variant={"outlined"}
                        className={
                          callsOrPuts === "call"
                            ? classes.selected
                            : classes.unSelected
                        }
                      >
                        Calls
                      </Button>
                      <Button
                        color="inherit"
                        onClick={(e) => {
                          setCallsOrPuts("put");
                          setChosenOptionChain(optionChain.puts);
                        }}
                        variant={"outlined"}
                        className={
                          callsOrPuts === "put"
                            ? classes.selected
                            : classes.unSelected
                        }
                      >
                        Puts
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item>
                    <FormControl
                      variant="outlined"
                      className={classes.formControl}
                    >
                      <InputLabel id="demo-simple-select-outlined-label">
                        Expiration
                      </InputLabel>
                      <Select
                        labelId="demo-simple-select-outlined-label"
                        id="demo-simple-select-outlined"
                        value={expiration}
                        onChange={(e) => setExpiration(e.target.value)}
                        label="Expiration"
                      >
                        {expirationDates.map((exp) => {
                          let date = moment.unix(exp).utc();
                          let format =
                            date.year() === moment().year()
                              ? "MMMM Do"
                              : "MMMM Do, YYYY";
                          return (
                            <MenuItem value={exp}>
                              {date.format(format)}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} className={classes.table}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Strike Price</TableCell>
                            <TableCell>Break Even</TableCell>
                            <TableCell>% Change</TableCell>
                            <TableCell>Change</TableCell>
                            <TableCell>Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>{displayCallOptions()}</TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  {selectedOption > 0 && (
                    <>
                      <Slider
                        step={0.5}
                        min={0}
                        max={300}
                        value={symbolPrice}
                        onChange={(e, nV) => setSymbolPrice(nV)}
                      />
                      <Grid item xs={12}>
                        {generateChart()}
                      </Grid>
                    </>
                  )}
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
      <Dialog
        open={contactUs}
        fullWidth
        maxWidth="sm"
        className={classes.dialog}
      >
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
