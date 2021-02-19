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
import moment from "moment";
import greeks from "greeks";

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

  const currencyFormat = (num) => {
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  };

  const displayOptions = () => {
    return chosenOptionChain
      .filter((opt) => opt)
      .map((opt) => {
        let currSelected = (opt.strike === selected.strike);
        let sign = opt.percentChange >= 0 ? "+" : "-";
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
            <TableCell>${(opt.strike + opt.lastPrice).toFixed(2)}</TableCell>
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
    if (tableRef.current && selectedRef.current) {
      if (tableRef.current.scrollTop !== selectedRef.current.offsetTop) {
        let containerHeight = tableRef.current.offsetHeight;
        let targetOffset = selectedRef.current.offsetTop;
        let targetHeight = selectedRef.current.offsetHeight;
        let top = targetOffset - targetHeight + 7;

        tableRef.current.scroll({
          top,
          behavior: "smooth",
        });
      }
    }
  }, [selectedRef, tableRef]);

  React.useEffect(() => {
    let arr = chosenOptionChain.map((opt) => opt.strike);
    var closest = arr.reduce(function(prev, curr) {
      return (Math.abs(curr - currPrice) < Math.abs(prev - currPrice) ? curr : prev);
    });
    console.log(closest);
    setSelected(chosenOptionChain.find((opt) => opt.strike === closest) ?? {});
  }, [chosenOptionChain]);

  return (
    <>
    <Grid item container spacing={3} justify="space-between">
      <Grid item xs={12} lg={6}>
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
            titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
            title={`${symbol}
                    ${moment.unix(selected.expiration).add(1, 'day').format('M/D')}
                    $${selected.strike}c`}
            subheader="What Does This Mean?"
          />
          <CardContent>
            <Typography className={classes.dialog}>
              You are buying {quantity} contract{quantity > 1 && 's'} that gives
              you the right, <span className={classes.italics}>but not
              obligation</span>, to purchase <span className={classes.underlinedAsset}>
              {100*quantity}</span> shares of <span className={classes.underlinedGainOrLoss}>
              {symbol}</span> at a price of <span className={classes.underlinedAsset}>
              {currencyFormat(selected.strike)}</span> per share, on or before <span className={classes.underlined}>
              {moment.unix(selected.expiration).add(1, 'day').format('MMMM Do, YYYY')}</span>.
            </Typography>
            <Typography className={classes.dialog}>
              This contract will cost you <span className={classes.underlinedAsset}>
              {currencyFormat(price > 0 ? price*100*quantity : selected.lastPrice*100*quantity)}</span> total.
            </Typography>
            <Grid container alignItems="center" justify="flex-start" className={classes.extraspace}>
              <Grid item xs={1}>
              <WbIncandescentOutlinedIcon style={{fill: "gold", fontSize: 30}}/>
              </Grid>
              <Grid item xs>
              <Typography className={classes.dialog}>
               Use the pencil icon below to backfill with your own personal
               cost & quantity data to see personalized results below.
              </Typography>
              </Grid>
            </Grid>
            <Grid container alignItems="center" justify="flex-start" className={classes.extraspace}>
              <Grid item xs={1}>
              <CreateIcon
                style={{fontSize: 30}}
                onClick={() => {
                  calculateGreeks(selected);
                  setConfigDialogState(true);
                }}
              />
              </Grid>
              <Grid item xs>
              </Grid>
            </Grid>
          </CardContent>
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
          <Grid item xs={12}>
            <TextField
              label="Quantity"
              value={quantity}
              onChange={(e)=>setQuantity(e.target.value)}
              helperText="How many contracts do you own?"
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Price"
              value={price}
              onChange={(e)=>setPrice(e.target.value)}
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
                  <TableCell style={{fontWeight: 'bolder'}} align='right'>Delta</TableCell>
                  <TableCell style={{fontWeight: 'bolder'}} align='right'>Gamma</TableCell>
                  <TableCell style={{fontWeight: 'bolder'}} align='right'>Theta</TableCell>
                  <TableCell style={{fontWeight: 'bolder'}} align='right'>Vega</TableCell>
                  <TableCell style={{fontWeight: 'bolder'}} align='right'>Rho</TableCell>
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
              Black-Scholes</a> model and may not be 100% accurate.
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
