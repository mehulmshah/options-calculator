/* DashboardView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Button,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  Theme,
} from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: 600,
    margin: theme.spacing(1),
    marginTop: 50,
  },
  bold: {
    fontWeight: "bold",
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

interface OptionTableProps {
  chosenOptionChain: any;
  gainOrLoss: string;
  selectedOption: number;
  isSelected: (selected) => void;
}

function OptionTable({
  chosenOptionChain,
  gainOrLoss,
  selectedOption,
  isSelected,
}: OptionTableProps) {
  const classes = useStyles({ gainOrLoss });

  const displayCallOptions = () => {
    return chosenOptionChain
      .filter((call) => call)
      .map((call) => {
        let sign = call.percentChange > 0 ? "+" : "-";
        return (
          <TableRow
            key={call.contractSymbol}
            selected={call.strike === selectedOption}
            onClick={() => isSelected(call)}
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

  return (
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
  );
}

export default OptionTable;
