import React, { useContext, useEffect, useState } from "react"

import Paper from "@material-ui/core/Paper"
import Container from "@material-ui/core/Container"
import Grid from "@material-ui/core/Grid"
import { makeStyles } from "@material-ui/core/styles"
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Chip from "@material-ui/core/Chip";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";

import useTickets from "../../hooks/useTickets"
import api from "../../services/api";
import toastError from "../../errors/toastError";

import { AuthContext } from "../../context/Auth/AuthContext";

import { i18n } from "../../translate/i18n";

import Chart from "./Chart"

const useStyles = makeStyles(theme => ({
	container: {
		paddingTop: theme.spacing(4),
		paddingBottom: theme.spacing(4),
	},
	fixedHeightPaper: {
		padding: theme.spacing(2),
		display: "flex",
		overflow: "auto",
		flexDirection: "column",
		height: 240,
	},
	customFixedHeightPaper: {
		padding: theme.spacing(2),
		display: "flex",
		overflow: "auto",
		flexDirection: "column",
		height: 120,
		[theme.breakpoints.down("xs")]: {
			height: "auto",
		},
	},
	sectionTitle: {
		marginTop: theme.spacing(3),
		marginBottom: theme.spacing(1),
		fontWeight: 600,
	},
	breakdownPaper: {
		padding: theme.spacing(2),
		height: "100%",
	},
	chipRow: {
		display: "flex",
		flexWrap: "wrap",
		gap: theme.spacing(1),
		marginTop: theme.spacing(1),
	},
}))

const LEAD_STATUS_LABELS = {
	hot: { label: "🔥 Quente", color: "#e53935" },
	warm: { label: "⛅ Morno", color: "#fb8c00" },
	cold: { label: "❄️ Frio", color: "#1e88e5" },
	won: { label: "💰 Fechado", color: "#43a047" },
	lost: { label: "❌ Perdido", color: "#757575" },
};

const PIPELINE_STAGE_LABELS = {
	lead: "🎯 Novo Lead",
	contacted: "📞 Primeiro Contato",
	negotiating: "🤝 Em Negociação",
	proposal: "📄 Proposta Enviada",
	won: "🎉 Fechamento",
	lost: "❌ Perdido",
};

const SummaryCard = ({ title, value, classes }) => (
	<Paper className={classes.customFixedHeightPaper} style={{ overflow: "hidden" }}>
		<Typography component="h3" variant="h6" color="primary" paragraph>
			{title}
		</Typography>
		<Grid item>
			<Typography component="h1" variant="h4">
				{value}
			</Typography>
		</Grid>
	</Paper>
);

const Dashboard = () => {
	const classes = useStyles()

	const { user } = useContext(AuthContext);
	var userQueueIds = [];

	if (user.queues && user.queues.length > 0) {
		userQueueIds = user.queues.map(q => q.id);
	}

	const [summary, setSummary] = useState(null);

	useEffect(() => {
		api
			.get("/dashboard/summary")
			.then(({ data }) => setSummary(data))
			.catch(toastError);
	}, []);

	const GetTickets = (status, showAll, withUnreadMessages) => {

		const { count } = useTickets({
			status: status,
			showAll: showAll,
			withUnreadMessages: withUnreadMessages,
			queueIds: JSON.stringify(userQueueIds)
		});
		return count;
	}

	const isAdmin = user.profile === "admin";

	return (
		<div>
			<Container maxWidth="lg" className={classes.container}>
				<Grid container spacing={3}>
					<Grid item xs={12} sm={4}>
						<Paper className={classes.customFixedHeightPaper} style={{ overflow: "hidden" }}>
							<Typography component="h3" variant="h6" color="primary" paragraph>
								{i18n.t("dashboard.messages.inAttendance.title")}
							</Typography>
							<Grid item>
								<Typography component="h1" variant="h4">
									{GetTickets("open", "true", "false")}
								</Typography>
							</Grid>
						</Paper>
					</Grid>
					<Grid item xs={12} sm={4}>
						<Paper className={classes.customFixedHeightPaper} style={{ overflow: "hidden" }}>
							<Typography component="h3" variant="h6" color="primary" paragraph>
								{i18n.t("dashboard.messages.waiting.title")}
							</Typography>
							<Grid item>
								<Typography component="h1" variant="h4">
									{GetTickets("pending", "true", "false")}
								</Typography>
							</Grid>
						</Paper>
					</Grid>
					<Grid item xs={12} sm={4}>
						<Paper className={classes.customFixedHeightPaper} style={{ overflow: "hidden" }}>
							<Typography component="h3" variant="h6" color="primary" paragraph>
								{i18n.t("dashboard.messages.closed.title")}
							</Typography>
							<Grid item>
								<Typography component="h1" variant="h4">
									{GetTickets("closed", "true", "false")}
								</Typography>
							</Grid>
						</Paper>
					</Grid>
					<Grid item xs={12}>
						<Paper className={classes.fixedHeightPaper}>
							<Chart />
						</Paper>
					</Grid>
				</Grid>

				{summary && (
					<>
						<Typography variant="h6" className={classes.sectionTitle}>
							Minha Carteira
						</Typography>
						<Grid container spacing={3}>
							<Grid item xs={12} sm={3}>
								<SummaryCard
									classes={classes}
									title="Clientes na minha carteira"
									value={summary.myOwnedContactsCount}
								/>
							</Grid>
							<Grid item xs={12} sm={3}>
								<SummaryCard
									classes={classes}
									title="Vendas fechadas (mês)"
									value={summary.myWonThisMonth}
								/>
							</Grid>
							<Grid item xs={12} sm={3}>
								<SummaryCard
									classes={classes}
									title="Lembretes hoje"
									value={summary.myRemindersToday}
								/>
							</Grid>
							<Grid item xs={12} sm={3}>
								<SummaryCard
									classes={classes}
									title="Test-drives hoje"
									value={summary.myTestDrivesToday}
								/>
							</Grid>
						</Grid>
					</>
				)}

				{summary && isAdmin && (
					<>
						<Typography variant="h6" className={classes.sectionTitle}>
							Visão Geral (Administrador)
						</Typography>
						<Grid container spacing={3}>
							<Grid item xs={12} sm={3}>
								<SummaryCard
									classes={classes}
									title="Test-drives hoje (todos)"
									value={summary.testDrivesToday}
								/>
							</Grid>
							<Grid item xs={12} sm={3}>
								<SummaryCard
									classes={classes}
									title="Test-drives esta semana"
									value={summary.testDrivesThisWeek}
								/>
							</Grid>
							<Grid item xs={12} sm={3}>
								<SummaryCard
									classes={classes}
									title="Lembretes atrasados"
									value={summary.remindersOverdue}
								/>
							</Grid>
							<Grid item xs={12} sm={3}>
								<SummaryCard
									classes={classes}
									title="Veículos disponíveis"
									value={summary.vehiclesAvailable}
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<Paper className={classes.breakdownPaper} variant="outlined">
									<Typography variant="subtitle1" style={{ fontWeight: 600 }}>
										Leads por Temperatura
									</Typography>
									<Box className={classes.chipRow}>
										{Object.entries(summary.leadsByStatus || {}).map(([key, count]) => (
											<Chip
												key={key}
												label={`${LEAD_STATUS_LABELS[key]?.label || key}: ${count}`}
												style={{
													backgroundColor: LEAD_STATUS_LABELS[key]?.color,
													color: "#fff",
												}}
											/>
										))}
										{Object.keys(summary.leadsByStatus || {}).length === 0 && (
											<Typography variant="body2" color="textSecondary">
												Nenhum lead classificado ainda.
											</Typography>
										)}
									</Box>
								</Paper>
							</Grid>

							<Grid item xs={12} md={6}>
								<Paper className={classes.breakdownPaper} variant="outlined">
									<Typography variant="subtitle1" style={{ fontWeight: 600 }}>
										Leads por Etapa do Funil
									</Typography>
									<Box className={classes.chipRow}>
										{Object.entries(summary.leadsByStage || {}).map(([key, count]) => (
											<Chip
												key={key}
												label={`${PIPELINE_STAGE_LABELS[key] || key}: ${count}`}
												variant="outlined"
											/>
										))}
										{Object.keys(summary.leadsByStage || {}).length === 0 && (
											<Typography variant="body2" color="textSecondary">
												Nenhum lead classificado ainda.
											</Typography>
										)}
									</Box>
								</Paper>
							</Grid>

							<Grid item xs={12}>
								<Paper className={classes.breakdownPaper} variant="outlined">
									<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 8 }}>
										Top Vendedores (mês atual)
									</Typography>
									<Table size="small">
										<TableHead>
											<TableRow>
												<TableCell>Vendedor</TableCell>
												<TableCell align="center">Tickets recebidos</TableCell>
												<TableCell align="center">Vendas fechadas</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{(summary.topSalespeople || []).map((sp) => (
												<TableRow key={sp.userId}>
													<TableCell>{sp.name}</TableCell>
													<TableCell align="center">{sp.ticketsThisMonth}</TableCell>
													<TableCell align="center">{sp.wonThisMonth}</TableCell>
												</TableRow>
											))}
											{(summary.topSalespeople || []).length === 0 && (
												<TableRow>
													<TableCell colSpan={3} align="center">
														Sem dados suficientes este mês.
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</Paper>
							</Grid>
						</Grid>
					</>
				)}
			</Container>
		</div>
	)
}

export default Dashboard
