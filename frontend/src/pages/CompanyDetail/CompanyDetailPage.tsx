import * as React from "react";
import { useEffect } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import { useNavigate, useParams } from "react-router-dom";
import googleImageUser from "../../assets/Images/icons8-google-48.png";
import linkdinImageUser from "../../assets/Images/linkedin-big-logo.png";
import userImageUser from "../../assets/Images/user.png";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { getCompanyDetailAction } from "../../store/company/actions/companyActions";
import { Typography } from "@mui/material";

interface CompanyDetailData {
  name: string;
  phone: string;
  Industry: string;
  Employee: string;
  Trading: string;
  Location: string;
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: "#000",
}));

const FlexContainer = styled(Grid)({
  display: "flex",
  justifyContent: "center",
  margin: "10px",

  textAlign: "center",
});
const SpacedItem = styled(Item)({
  margin: "0 4px",
});

const CompanyDetailPage = () => {
  const { id: companyId } = useParams();
  const companyDetailsData = useSelector(
    (state: any) => state.getCompanyDetailStore
  );

  const {
    loading: getCompanyDetailsLoading,
    error: getCompanyDetailsError,
    getCompanyDetailsResponse,
  } = companyDetailsData;

  console.log("getCompanyDetailsResponse", getCompanyDetailsResponse);
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const companyDetailData: CompanyDetailData = {
    name: "Senew Tech",
    phone: "030000000000",
    Industry: "Software Industry",
    Employee: "200-300",
    Trading: "NASDAQ: AMZN.",
    Location: "Lahore Pakistan",
  };

  useEffect(() => {
    dispatch(getCompanyDetailAction(companyId) as any);
  }, [dispatch, companyId]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} spacing={6}>
          <Grid item xs={12}>
            <Item>
              <img
                src={googleImageUser}
                alt=""
                style={{ width: "20px", height: "20px" }}
              />
              {getCompanyDetailsResponse?.companyDomain[0]}
            </Item>
          </Grid>
          <Grid item xs={12}>
            <Item>
              <img
                src={linkdinImageUser}
                alt=""
                style={{ width: "20px", height: "20px" }}
              />
              {getCompanyDetailsResponse?.phoneNumber}/ Add Phone
            </Item>
          </Grid>
        </Grid>
        <Grid item xs={12} spacing={6}>
          <FlexContainer>
            <Grid item xs={6}>
              <Item>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ marginRight: "8px" }}>Valid Category:</span>
                  {getCompanyDetailsResponse?.validCategory &&
                    Object.entries(
                      getCompanyDetailsResponse?.validCategory
                    ).map(([key, value]) => (
                      <div key={key}>
                        {key}: {value as React.ReactNode}
                      </div>
                    ))}
                </div>
              </Item>
            </Grid>
            <Grid item xs={6}>
              <Item>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ marginRight: "8px" }}>Valid Format:</span>
                  {getCompanyDetailsResponse?.companyEmailFormate &&
                    Object.entries(
                      getCompanyDetailsResponse?.companyEmailFormate
                    ).map(([key, value]) => (
                      <div key={key}>
                        {key}: {value as React.ReactNode}
                      </div>
                    ))}
                </div>
              </Item>
            </Grid>
          </FlexContainer>
        </Grid>

        <Grid item xs={12} spacing={6}>
          <Grid item xs={6}>
            <Item>
              Industry:
              {getCompanyDetailsResponse?.industry}
            </Item>
          </Grid>
          <Grid item xs={6}>
            <Item>
              Employee Count:
              {getCompanyDetailsResponse?.employeeSize}
            </Item>
          </Grid>
          <Grid item xs={6}>
            <Item>
              Company Name:
              {getCompanyDetailsResponse?.companyName}
            </Item>
          </Grid>
          <Grid item xs={6}>
            <Item>
              Location:
              {getCompanyDetailsResponse?.headquarterLocation}
            </Item>
          </Grid>
        </Grid>
        <Grid item xs={12} spacing={6}>
          <Grid item xs={12}>
            <Link
              to={`/employees/${companyId}?domainName=${getCompanyDetailsResponse?.companyDomain[0]}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {" "}
              <Item>
                {" "}
                <img
                  src={userImageUser}
                  alt=""
                  style={{ width: "17px", height: "17px" }}
                />
                Employees
              </Item>
            </Link>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompanyDetailPage;
