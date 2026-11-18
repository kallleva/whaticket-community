import { Request, Response } from "express";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";

type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId
  });

  SetTicketMessagesAsRead(ticket);

  return res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  let ticket = await ShowTicketService(ticketId);

  // Humano respondeu manualmente pelo painel: assume o ticket (se ainda não
  // tinha dono) e, se um agente de IA estava conversando, ele para aqui —
  // enviar uma mensagem é o que caracteriza o vendedor assumindo a conversa
  // (só abrir/aceitar o ticket não pausa a IA).
  if (!ticket.userId) {
    await UpdateTicketService({
      ticketData: {
        userId: +req.user.id,
        status: "open",
        // UpdateTicketService sempre grava os 3 campos juntos — sem
        // reenviar queueId aqui, um ticket já numa fila (pending, sem
        // usuário) perderia essa fila ao ser assumido manualmente.
        queueId: ticket.queueId
      },
      ticketId
    });
    ticket = await ShowTicketService(ticketId);
  }

  if (ticket.aiAgentId) {
    await ticket.update({ aiAgentId: null, agentFallbackQueueId: null });
  }

  SetTicketMessagesAsRead(ticket);

  if (medias) {
    await Promise.all(
      medias.map(async (media: Express.Multer.File) => {
        await SendWhatsAppMedia({ media, ticket });
      })
    );
  } else {
    await SendWhatsAppMessage({ body, ticket, quotedMsg });
  }

  return res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit("appMessage", {
    action: "update",
    message
  });

  return res.send();
};
