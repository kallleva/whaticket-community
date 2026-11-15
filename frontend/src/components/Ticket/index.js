import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";

import { toast } from "react-toastify";
import openSocket from "../../services/socket-io";
import clsx from "clsx";

import { Paper, makeStyles, Tabs, Tab } from "@material-ui/core";
import ChatIcon from "@material-ui/icons/Chat";
import PersonIcon from "@material-ui/icons/Person";

import ContactDrawer from "../ContactDrawer";
import MessageInput from "../MessageInput/";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtons";
import MessagesList from "../MessagesList";
import CustomerTab from "../CustomerTab";
import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import toastError from "../../errors/toastError";

const drawerWidth = 320;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },

  ticketInfo: {
    maxWidth: "50%",
    flexBasis: "50%",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "80%",
      flexBasis: "80%",
    },
  },
  ticketActionButtons: {
    maxWidth: "50%",
    flexBasis: "50%",
    display: "flex",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "100%",
      flexBasis: "100%",
      marginBottom: "5px",
    },
  },

  mainWrapper: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    marginRight: -drawerWidth,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  mainWrapperShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: theme.spacing(1),
  },

  tabsWrapper: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    minHeight: 44,
  },
  tab: {
    minHeight: 44,
    fontWeight: 600,
    fontSize: "0.875rem",
    textTransform: "none",
  },
  tabPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
  },
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();

  const [activeTab, setActiveTab] = useState("messages");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {
          const { data } = await api.get("/tickets/" + ticketId);

          setContact(data.contact);
          setTicket(data);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      void fetchTicket();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, history]);

  useEffect(() => {
    const socket = openSocket();

    socket.on("connect", () => socket.emit("joinChatBox", ticketId));

    socket.on("ticket", (data) => {
      if (data.action === "update" && data.ticket?.id === +ticketId) {
        setTicket(data.ticket);
      }

      if (data.action === "delete" && data.ticketId === +ticketId) {
        toast.success("Ticket deleted sucessfully.");
        history.push("/tickets");
      }
    });

    socket.on("contact", (data) => {
      if (data.action === "update") {
        setContact((prevState) => {
          if (prevState.id === data.contact?.id) {
            return { ...prevState, ...data.contact };
          }
          return prevState;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticketId, history]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <div className={classes.root} id="drawer-container">
      <Paper
        variant="outlined"
        elevation={0}
        className={clsx(classes.mainWrapper, {
          [classes.mainWrapperShift]: drawerOpen,
        })}
      >
        <TicketHeader loading={loading}>
          <div className={classes.ticketInfo}>
            <TicketInfo
              contact={contact}
              ticket={ticket}
              onClick={handleDrawerOpen}
            />
          </div>
          <div className={classes.ticketActionButtons}>
            <TicketActionButtons ticket={ticket} />
          </div>
        </TicketHeader>
        <Paper square elevation={0} className={classes.tabsWrapper}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="standard"
          >
            <Tab
              value="messages"
              label="Mensagens"
              icon={<ChatIcon fontSize="small" />}
              className={classes.tab}
            />
            <Tab
              value="customer"
              label="Ficha do Cliente"
              icon={<PersonIcon fontSize="small" />}
              className={classes.tab}
            />
          </Tabs>
        </Paper>
        {activeTab === "messages" ? (
          <div className={classes.tabPanel}>
            <ReplyMessageProvider>
              <MessagesList
                ticketId={ticketId}
                isGroup={ticket.isGroup}
              ></MessagesList>
              <MessageInput ticketStatus={ticket.status} />
            </ReplyMessageProvider>
          </div>
        ) : (
          <div className={classes.tabPanel}>
            <CustomerTab contact={contact} ticket={ticket} />
          </div>
        )}
      </Paper>
      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
      />
    </div>
  );
};

export default Ticket;
