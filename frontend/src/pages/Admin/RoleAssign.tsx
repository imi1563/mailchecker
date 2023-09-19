import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import {
  deleteUserAction,
  getUsersListAction,
  setUserRolesAction,
} from "../../store/user/actions/userActions";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import deleteImageUser from "../../assets/Images/delete.png";

// Define the UserData type
type UserData = {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isCompanyEmployee: boolean;
};

export default function BasicTable() {
  const dispatch = useDispatch();
  const getUsersListData = useSelector((state: any) => state.getUsersListStore);

  const {
    loading: getUsersListLoading,
    error: getUsersListError,
    getUsersListResponse,
  } = getUsersListData;

  // Initialize userStates from the API data
  const [userStates, setUserStates] = useState<{
    [userId: string]: { isAdmin: boolean; isCompanyEmployee: boolean };
  }>({});

  useEffect(() => {
    dispatch(getUsersListAction() as any);
  }, [dispatch]);

  useEffect(() => {
    if (getUsersListResponse) {
      const initialUserStates: {
        [userId: string]: { isAdmin: boolean; isCompanyEmployee: boolean };
      } = {};
      getUsersListResponse.forEach((user: UserData) => {
        initialUserStates[user._id] = {
          isAdmin: user.isAdmin,
          isCompanyEmployee: user.isCompanyEmployee,
        };
      });
      setUserStates(initialUserStates);
    }
  }, [getUsersListResponse]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    userId: string
  ) => {
    const { name, checked } = event.target;

    setUserStates((prevStates) => ({
      ...prevStates,
      [userId]: {
        ...prevStates[userId],
        [name]: checked,
      },
    }));
  };

  const handleSaveClick = (userId: string) => {
    const userState = userStates[userId];

    if (userState) {
      const userRoles = {
        _id: userId,
        isAdmin: userState.isAdmin,
        isCompanyEmployee: userState.isCompanyEmployee,
      };
      console.log("userRoles", userRoles);
      dispatch(setUserRolesAction(userRoles) as any);
    }
  };

  const deleteButtonHandler = (userId:any) => {
    console.log("Delete Button Clicked", userId);
    dispatch(deleteUserAction(userId) as any)
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Delete User</TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Email</TableCell>
            <TableCell align="right">Admin</TableCell>
            <TableCell align="right">Company Employee</TableCell>
            <TableCell align="right">Assign Role</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getUsersListResponse &&
            getUsersListResponse?.map((user: UserData) => (
              <TableRow
                key={user._id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <img
                    src={deleteImageUser}
                    alt=""
                    style={{ width: "20px", height: "20px" }}
                    onClick={() => deleteButtonHandler(user._id)}
                  />
                </TableCell>
                <TableCell component="th" scope="row">
                  {user.name}
                </TableCell>
                <TableCell align="right">{user.email}</TableCell>
                <TableCell align="right">
                  <Switch
                    name="isAdmin"
                    checked={userStates[user._id]?.isAdmin || false}
                    onChange={(e) => handleChange(e, user._id)}
                    inputProps={{ "aria-label": "controlled" }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Switch
                    name="isCompanyEmployee"
                    checked={userStates[user._id]?.isCompanyEmployee || false}
                    onChange={(e) => handleChange(e, user._id)}
                    inputProps={{ "aria-label": "controlled" }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    onClick={() => handleSaveClick(user._id)}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
