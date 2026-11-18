import React from "react";

import { Avatar, CardHeader, Chip, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	queueStrip: {
		position: "absolute",
		top: 0,
		left: 0,
		width: 8,
		height: "100%",
		backgroundColor: theme.palette.queue.fallback,
	},
	subheaderRow: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		flexWrap: "wrap",
	},
	queueChip: {
		height: 20,
		fontSize: 11,
	},
}));

const TicketInfo = ({ contact, ticket, onClick }) => {
	const classes = useStyles();

	return (
		<>
			<span
				className={classes.queueStrip}
				style={{ backgroundColor: ticket.queue?.color }}
			/>
			<CardHeader
				onClick={onClick}
				style={{ cursor: "pointer" }}
				titleTypographyProps={{ noWrap: true }}
				subheaderTypographyProps={{ noWrap: true, component: "div" }}
				avatar={
					<Avatar src={contact.profilePicUrl} alt="contact_image">
						{contact.name?.charAt(0)}
					</Avatar>
				}
				title={`${contact.name} #${ticket.id}`}
				subheader={
					<Box className={classes.subheaderRow}>
						{ticket.queue?.name && (
							<Chip
								label={ticket.queue.name}
								size="small"
								className={classes.queueChip}
								style={{
									backgroundColor: ticket.queue.color,
									color: "#fff",
								}}
							/>
						)}
						{ticket.user &&
							`${i18n.t("messagesList.header.assignedTo")} ${ticket.user.name}`}
					</Box>
				}
			/>
		</>
	);
};

export default TicketInfo;
