import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import CompanyDetail from "./CompanyDetail";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

const FlexContainer = styled(Grid)({
  display: "flex",
  justifyContent: "space-between",
  margin: "10px",
});
const SpacedItem = styled(Item)({
  margin: "0 4px",
});
const CompanyMainDesign = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <Item>Employees</Item>
        </Grid>
        <Grid item xs={2}>
          <Item>Companies</Item>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ padding: "20px" }}>
        <Grid item xs={3}>
          <Item>
            <FlexContainer spacing={2}>
              <Grid item xs={5}>
                <SpacedItem>Searched</SpacedItem>
              </Grid>
              <Grid item xs={7}>
                <SpacedItem>Saved Items</SpacedItem>
              </Grid>
            </FlexContainer>
          </Item>
        </Grid>
        <Grid item xs={9}>
          <Item>
            <CompanyDetail />
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyMainDesign;
