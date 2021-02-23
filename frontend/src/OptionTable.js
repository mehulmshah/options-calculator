/* DashboardView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Grid,
  makeStyles,
  withStyles,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Tooltip,
  Typography,
} from "@material-ui/core";
import CreateIcon from "@material-ui/icons/Create";
import WbIncandescentOutlinedIcon from '@material-ui/icons/WbIncandescentOutlined';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import CasinoRoundedIcon from '@material-ui/icons/CasinoRounded';
import LocalAtmOutlinedIcon from '@material-ui/icons/LocalAtmOutlined';
import moment from "moment";
import blackScholes from "black-scholes";
import greeks from "greeks";
import CurrencyTextField from '@unicef/material-ui-currency-textfield'

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: 600,
    margin: theme.spacing(1),
    marginTop: 50,
  },
  bold: {
    fontWeight: "bold",
  },
  dialog: {
    margin: theme.spacing(1),
  },
  note: {
    fontStyle: "italic",
    margin: theme.spacing(1),
    fontSize: 14,
  },
  tableRowLightMode: {
    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss + "4D",
      color: "white",
    },
    "&:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss + "1A",
    },
    cursor: "pointer",
  },
  table: {
    width: "100%",
    maxHeight: 500,
    height: 400,
  },
  test: {
    backgroundColor: ({ gainOrLoss }) => gainOrLoss,
    "&:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss,
    },
  },
  spacing: {
    margin: theme.spacing(1),
  },
  underlined: {
    textDecoration: "underline",
    color: "black",
  },
  underlinedLiability: {
    textDecoration: "underline",
    color: "#FF5000",
  },
  underlinedAsset: {
    textDecoration: "underline",
    color: "#00C805",
  },
  underlinedGainOrLoss: {
    textDecoration: "underline",
    color: ({ gainOrLoss }) => gainOrLoss,
  },
  italics: {
    fontStyle: "italic",
  },
  extraspace: {
    fontStyle: "italic",
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(5),
  },
}));

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 350,
    fontSize: theme.typography.pxToRem(14),
    border: '1px solid #dadde9',
  },
}))(Tooltip);

interface OptionTableProps {
  symbol: string;
  currPrice: number;
  chosenOptionChain: any;
  gainOrLoss: string;
  callsOrPuts: string;
  isSelected: (selected) => void;
  overrideConfig: (config) => void;
}

const INFLATION_RATE = 0.014;

function OptionTable({
  symbol,
  currPrice,
  chosenOptionChain,
  gainOrLoss,
  callsOrPuts,
  isSelected,
  overrideConfig,
}: OptionTableProps) {
  const classes = useStyles({ gainOrLoss });
  const tableRef = React.createRef();
  const selectedRef = React.createRef();
  const [configDialogState, setConfigDialogState] = React.useState(false);
  const [selected, setSelected] = React.useState({});
  const [quantity, setQuantity] = React.useState(1);
  const [price, setPrice] = React.useState(0);
  const [greekVals, setGreekVals] = React.useState({});
  const [chanceOfProfit, setChanceOfProfit] = React.useState(0);

  const currencyFormat = (num) => {
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  };

  const displayOptions = () => {
    return chosenOptionChain
      .filter((opt) => opt)
      .map((opt) => {
        let currSelected = (opt.strike === selected.strike);
        let sign = opt.percentChange >= 0 ? "+" : "-";
        let breakeven = opt.strike + opt.lastPrice;
        return (
          <TableRow
            key={opt.contractSymbol}
            selected={currSelected}
            ref={currSelected ? selectedRef : undefined}
            onClick={() => {
              setSelected(opt);
              isSelected(opt);

            }}
            className={classes.tableRowLightMode}
          >
            <TableCell className={classes.bold}>${opt.strike}</TableCell>
            <TableCell>{currencyFormat(breakeven)}</TableCell>
            <TableCell>
              {sign + Math.abs(opt.percentChange).toFixed(2)}%
            </TableCell>
            <TableCell>
              <Button
                className={classes.test}
                variant={
                  opt.strike === selected.strike ? "contained" : "outlined"
                }
              >
                ${opt.lastPrice.toFixed(2)}
              </Button>
            </TableCell>
          </TableRow>
        );
      });
  };

  const calculateGreeks = (option) => {
    let timeDiff =
    (Math.abs(moment().diff(moment.unix(option.expiration).utc(), "days")) + 1)
    / 365;
    let delta = greeks.getDelta(
      currPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      INFLATION_RATE,
      callsOrPuts
    );
    let gamma = greeks.getGamma(
      currPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      INFLATION_RATE,
      callsOrPuts
    );
    let theta = greeks.getTheta(
      currPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      INFLATION_RATE,
      callsOrPuts
    );
    let vega = greeks.getVega(
      currPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      INFLATION_RATE,
      callsOrPuts
    );
    let rho = greeks.getRho(
      currPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      INFLATION_RATE,
      callsOrPuts
    );

    setGreekVals({
      delta: delta.toFixed(4),
      gamma: gamma.toFixed(4),
      theta: theta.toFixed(4),
      vega: vega.toFixed(4),
      rho: rho.toFixed(4),
    });
  };

  React.useEffect(() => {
    let top = 0;
    if (tableRef.current && !selectedRef.current) {
      let arr = chosenOptionChain.map((opt) => opt.strike);
      var closest = arr.reduce(function(prev, curr) {
        return (Math.abs(curr - currPrice) < Math.abs(prev - currPrice) ? curr : prev);
      });
      let index = chosenOptionChain.findIndex((opt) => opt.strike === closest);
      let ROW_HEIGHT = 69;
      top = ROW_HEIGHT*index;
    } else if (tableRef.current && selectedRef.current) {
      if (tableRef.current.scrollTop !== selectedRef.current.offsetTop) {
        let containerHeight = tableRef.current.offsetHeight;
        let targetOffset = selectedRef.current.offsetTop;
        let targetHeight = selectedRef.current.offsetHeight;
        top = targetOffset - targetHeight + 7;
      }
    }
    tableRef.current.scroll({
      top,
      behavior: "smooth",
    });
  }, [selectedRef, tableRef]);

  React.useEffect(() => {
    setSelected({});
    isSelected({});
  },[symbol]);

  React.useEffect(() => {
    if (selected) {
      let avgCost = price > 0 ? parseFloat(price) : selected.lastPrice;
      let timeDiffInYears =
        Math.abs(moment().diff(moment.unix(selected.expiration).utc(), "days")) / 365;
      let output = greeks.getDelta(
        currPrice,
        selected.strike + avgCost,
        timeDiffInYears,
        selected.impliedVolatility,
        INFLATION_RATE,
        callsOrPuts
      );
      setChanceOfProfit(100*(output));
    }
  }, [selected, greekVals, price]);

  return (
    <>
    <Grid item container spacing={3} justify="space-evenly">
      <Grid item xs={12} lg={selected.strike ? 6 : 12}>
        <TableContainer component={Paper} className={classes.table} ref={tableRef}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Grid container alignItems="stretch" justify="flex-start">
                    <Grid item xs={3}>
                      <HtmlTooltip
                        placement="top"
                        title="The price at which you may buy shares of the stock if you choose to exercise the option"
                      >
                        <InfoOutlinedIcon style={{cursor: 'pointer'}}/>
                      </HtmlTooltip>
                    </Grid>
                    <Grid item xs>
                      Strike Price
                    </Grid>
                  </Grid>
                </TableCell>
                <TableCell>
                  <Grid container alignItems="stretch">
                    <Grid item xs={3}>
                      <HtmlTooltip
                        placement="top"
                        title="The price of the stock at which your profit is $0, if you choose to exercise the option.
                        It is simply the strike price plus the cost of the contract."
                      >
                        <InfoOutlinedIcon style={{cursor: 'pointer'}}/>
                      </HtmlTooltip>
                    </Grid>
                    <Grid item xs>
                      Break Even
                    </Grid>
                  </Grid>
                </TableCell>
                <TableCell>
                  <Grid container alignItems="stretch">
                    <Grid item xs={3}>
                      <HtmlTooltip
                        placement="top"
                        title="The % change in the price of the option from the previous trading day."
                      >
                        <InfoOutlinedIcon style={{cursor: 'pointer'}}/>
                      </HtmlTooltip>
                    </Grid>
                    <Grid item xs>
                      % Change
                    </Grid>
                  </Grid>
                </TableCell>
                <TableCell>
                  <Grid container alignItems="stretch" justify="flex-start">
                    <Grid item xs={3}>
                      <HtmlTooltip
                        placement="top"
                        title="The current price of the option contract. Because the contract is for 100 shares, you must pay
                        100 times this price to own the contract."
                      >
                        <InfoOutlinedIcon style={{cursor: 'pointer'}}/>
                      </HtmlTooltip>
                    </Grid>
                    <Grid item xs>
                      Price
                    </Grid>
                  </Grid>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{displayOptions()}</TableBody>
          </Table>
        </TableContainer>
      </Grid>
      {/* chosen option explanation */}
      {selected.strike && (
      <Grid item xs={12} lg={6}>
        <Card className={classes.table}>
          <CardHeader
            className={classes.dialog}
            titleTypographyProps={{ variant: "h5", fontWeight: "bold" }}
            title={`${symbol}
                    ${moment.unix(selected.expiration).add(1, 'day').format('M/D')}
                    $${selected.strike}c`}
            subheader="What Does This Mean?"
          />
          <CardContent>
            <Typography paragraph>
              You are buying {quantity} contract{quantity > 1 && 's'} that gives
              you the right, <span className={classes.italics}>but not
              obligation</span>, to purchase <span style={{fontWeight: 'bold'}}>
              {100*quantity}</span> shares of <span className={classes.underlinedGainOrLoss}>
              {symbol}</span> at a price of <span style={{fontWeight: 'bold'}}>
              {currencyFormat(selected.strike)}</span> per share, on or before <span style={{fontWeight: 'bold'}}>
              {moment.unix(selected.expiration).add(1, 'day').format('MMMM Do, YYYY')}</span>.
            </Typography>
            <TableContainer component={Paper} style={{marginTop: 20}}>
              <Table stickyHeader style={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                      }}>
                        <span style={{marginRight: 3}}>Cost</span>
                        <LocalAtmOutlinedIcon style={{fill: 'gold', fontSize: 30}}/>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                      }}>
                        <span style={{marginRight: 5}}>Probability of Profit</span>
                        <CasinoRoundedIcon style={{fill: '#3cd070', fontSize: 30}}/>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                      }}>
                        <span style={{marginRight: 5}}>Customize</span>
                        <CreateIcon
                          style={{fontSize: 30, cursor: 'pointer'}}
                          onClick={() => {
                            calculateGreeks(selected);
                            setConfigDialogState(true);
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell style={{fontSize: 18, fontWeight: 'bold'}}>
                      {currencyFormat(price > 0 ? price*100*quantity : selected.lastPrice*100*quantity)}
                    </TableCell>
                    <TableCell style={{fontSize: 18, fontWeight: 'bold'}}>
                      {Math.round(chanceOfProfit)}%
                    </TableCell>
                    <TableCell style={{fontSize: 18, fontWeight: 'bold'}}>
                      {quantity} contract{quantity>1&&'s'} @ {price > 0 ? currencyFormat(parseFloat(price)) : currencyFormat(selected.lastPrice)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

          </CardContent>
          <CardActions className={classes.dialog}>
            <Button
              variant="outlined"
              style={{marginLeft: 'auto'}}
              onClick={() => {
                setSelected({});
                isSelected({});
                overrideConfig({quantity: 1});
                setQuantity(1);
                setPrice(0);
              }}
            >
              Reset
            </Button>
          </CardActions>
        </Card>
      </Grid>
      )}
    </Grid>
    <Dialog open={configDialogState} className={classes.spacing}>
      <DialogTitle>
        {symbol} {moment.unix(selected.expiration).add(1, 'day').format('M/D')} $
        {selected.strike}c
      </DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item xs={12} className={classes.dialog}>
            <TextField
              label="Quantity"
              variant="outlined"
              value={quantity}
              onChange={(e)=>setQuantity(e.target.value)}
              helperText="How many contracts do you own?"
              inputProps={{min: 0, style: { textAlign: 'right' }}}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} className={classes.dialog}>
            <CurrencyTextField
              variant="outlined"
              label="Price"
              value={price}
              onChange={(e,v)=>{setPrice(v);}}
              helperText="What was your average cost?"
              fullWidth
            />
          </Grid>

        </Grid>
        <Grid container justify="center" className={classes.dialog}>
          <Grid item xs={12}>
            <Table>
              <TableHead>
                <TableRow>
                  <HtmlTooltip
                    placement="top"
                    title="Represents the sensitivity of an option's price to
                    changes in the value of the underlying security."
                  >
                    <TableCell style={{fontWeight: 'bolder'}} align='right'>Delta</TableCell>
                  </HtmlTooltip>
                  <HtmlTooltip
                    placement="top"
                    title="Represents the rate of change of Delta relative to
                    the change of the price of the underlying security."
                  >
                    <TableCell style={{fontWeight: 'bolder'}} align='right'>Gamma</TableCell>
                  </HtmlTooltip>
                  <HtmlTooltip
                    placement="top"
                    title="Represents the rate of time decay of an option."
                  >
                    <TableCell style={{fontWeight: 'bolder'}} align='right'>Theta</TableCell>
                  </HtmlTooltip>
                  <HtmlTooltip
                    placement="top"
                    title="Represents an option's sensitivity to volatility."
                  >
                  <TableCell style={{fontWeight: 'bolder'}} align='right'>Vega</TableCell>
                  </HtmlTooltip>
                  <HtmlTooltip
                    placement="top"
                    title="Represents how sensitive an option's price is relative
                    to interest rates."
                  >
                  <TableCell style={{fontWeight: 'bolder'}} align='right'>Rho</TableCell>
                  </HtmlTooltip>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell align='right'>{greekVals.delta}</TableCell>
                  <TableCell align='right'>{greekVals.gamma}</TableCell>
                  <TableCell align='right'>{greekVals.theta}</TableCell>
                  <TableCell align='right'>{greekVals.vega}</TableCell>
                  <TableCell align='right'>{greekVals.rho}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
          <Grid item>
            <Typography className={classes.note}>
              Note: These values are an approximation calculated from the <a
              href="https://www.investopedia.com/terms/b/blackscholes.asp">
              Black-Scholes</a> model and may not be fully accurate. Hover over
              any greek variable to learn more. Want a more in-depth
              explanation with examples? Visit our blog post here.
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={()=>setConfigDialogState(false)}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={()=> {
            overrideConfig({quantity: quantity, avgCost: price});
            setConfigDialogState(false);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

export default OptionTable;
