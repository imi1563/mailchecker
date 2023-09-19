import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import AdbIcon from "@mui/icons-material/Adb";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logOutHandlerAction } from "../../store/user/actions/userActions";
import { useNavigate } from "react-router-dom";

const pages = [
  { name: "Bulk", link: "/bulk" },
  { name: "Email Finder", link: "/email-finder" },
  { name: "Single", link: "/single-Email-Verify" },
  // { name: 'Deliverability', link: '/deliverability' },
  // { name: 'API', link: '/api' },
  { name: "Invalid Emails", link: "/invalid-Emails" },
  { name: "Company Data", link: "/company-Data" },
  { name: "Register", link: "/user-Register" },
  { name: "SignIn", link: "/user-SignIn" },
];
const settings = [
  { name: "Admin Roles", link: "/admin-Role" },
  { name: "Account", link: "/account" },
  { name: "Dashboard", link: "/dashboard" },
  { name: "Logout", link: "/logout" },
];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const userLoginInfo = localStorage.getItem("userLoginInfo")
    ? JSON.parse(localStorage.getItem("userLoginInfo") as any)
    : null;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    dispatch(logOutHandlerAction(navigate) as any);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            LOGO
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "flex" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              <MenuItem onClick={handleCloseNavMenu}>
                <Link
                  to="/bulk"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Typography textAlign="center">Bulk</Typography>
                </Link>
                <Link
                  to="/email-finder"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Typography textAlign="center">Email Finder</Typography>
                </Link>
                <Link
                  to="/single-Email-Verify"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Typography textAlign="center">
                    Single Email Verification
                  </Typography>
                </Link>
                <Link
                  to="/invalid-Emails"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Typography textAlign="center">Invalid Emails</Typography>
                </Link>
                <Link
                  to="/company-Data"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Typography textAlign="center">Company Data</Typography>
                </Link>
                {!userLoginInfo && (
                  <Link
                    to="/user-Register"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Typography textAlign="center">Register</Typography>
                  </Link>
                )}

                {userLoginInfo ? (
                  <Typography textAlign="center">
                    {userLoginInfo?.name}
                  </Typography>
                ) : (
                  <Link
                    to="/user-SignIn"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Typography textAlign="center">Sign In</Typography>
                  </Link>
                )}
              </MenuItem>
            </Menu>
          </Box>
          <AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography
              variant="h5"
              noWrap
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              LOGO
            </Typography>
          </Link>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <Button
              component={Link}
              to="/bulk"
              onClick={handleCloseNavMenu}
              sx={{ my: 2, color: "white", display: "block" }}
            >
              Bulk
            </Button>
            <Button
              component={Link}
              to="/email-finder"
              onClick={handleCloseNavMenu}
              sx={{ my: 2, color: "white", display: "block" }}
            >
              Email Finder
            </Button>
            <Button
              component={Link}
              to="/single-Email-Verify"
              onClick={handleCloseNavMenu}
              sx={{ my: 2, color: "white", display: "block" }}
            >
              Single Email Verification
            </Button>

            {/* <Button
              component={Link}
              to="/cDesign"
              onClick={handleCloseNavMenu}
              sx={{ my: 2, color: "white", display: "block" }}
            >
              Company Design
            </Button> */}

            {userLoginInfo && userLoginInfo.isAdmin && (
              <>
                <Button
                  component={Link}
                  to="/invalid-Emails"
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: "white", display: "block" }}
                >
                  Invalid Emails
                </Button>
                <Button
                  component={Link}
                  to="/company-Data"
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: "white", display: "block" }}
                >
                  Company Data
                </Button>
              </>
            )}

            {!userLoginInfo && (
              <Button
                component={Link}
                to="/user-Register"
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                Register
              </Button>
            )}

            {userLoginInfo ? (
              <Button sx={{ my: 2, color: "white", display: "block" }}>
                Hello! {userLoginInfo?.name}
              </Button>
            ) : (
              <Button
                component={Link}
                to="/user-SignIn"
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                Sign In
              </Button>
            )}

            {userLoginInfo && (
              <Button
                onClick={handleLogout}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                Sign Out
              </Button>
            )}
          </Box>
          {userLoginInfo && userLoginInfo.isAdmin && (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting.name} onClick={handleCloseUserMenu}>
                    <Link
                      to={setting.link}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Typography textAlign="center">{setting.name}</Typography>
                    </Link>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
