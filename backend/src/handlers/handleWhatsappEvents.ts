import { join } from "path";
import { promisify } from "util";
import { writeFile } from "fs";
import * as Sentry from "@sentry/node";

import { getIO } from "../libs/socket";
import { logger } from "../utils/logger";
import { debounce } from "../helpers/Debounce";
import { bufferIncomingFragment } from "../helpers/MessageFragmentBuffer";
import { withLock } from "../helpers/AsyncLock";
import formatBody from "../helpers/Mustache";

import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import Whatsapp from "../models/Whatsapp";
import Message from "../models/Message";

import CreateMessageService from "../services/MessageServices/CreateMessageService";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import CreateContactService from "../services/ContactServices/CreateContactService";
import assignTicketToQueue from "../services/FlowServices/AssignTicketToQueueHelper";
import {
  startFlow,
  advanceFlow,
  getWaitingNodeType
} from "../services/FlowServices/AdvanceFlowService";
import EnqueueAiAgentTurnService from "../services/AgentServices/EnqueueAiAgentTurnService";
import TranscribeAudioService from "../services/AgentServices/TranscribeAudioService";

import { whatsappProvider } from "../providers/WhatsApp/whatsappProvider";
import { MessageType, MessageAck } from "../providers/WhatsApp/types";

const FLOW_QUESTION_BUFFER_MS = 12000;

const writeFileAsync = promisify(writeFile);

export interface ContactPayload {
  name: string;
  number: string;
  lid?: string;
  profilePicUrl?: string;
  isGroup: boolean;
}

export interface MessagePayload {
  id: string;
  body: string;
  fromMe: boolean;
  hasMedia: boolean;
  type: MessageType;
  timestamp: number;
  from: string;
  to: string;
  hasQuotedMsg?: boolean;
  quotedMsgId?: string;
  mediaUrl?: string;
  mediaType?: string;
  ack?: MessageAck;
}

export interface MediaPayload {
  filename: string;
  mimetype: string;
  data: string;
}

export interface WhatsappContextPayload {
  whatsappId: number;
  unreadMessages: number;
  groupContact?: ContactPayload;
}

const makeRandomId = (length: number): string => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

const processLocationMessage = (
  messagePayload: MessagePayload
): MessagePayload => {
  if (messagePayload.type !== "location") return messagePayload;

  return messagePayload;
};

const saveMediaFile = async (mediaPayload: MediaPayload): Promise<string> => {
  const randomId = makeRandomId(5);
  const { filename: originalFilename } = mediaPayload;

  let filename: string;
  if (!originalFilename) {
    const [extension] = mediaPayload.mimetype.split("/")[1].split(";");
    filename = `${randomId}-${new Date().getTime()}.${extension}`;
  } else {
    const baseName = originalFilename.split(".").slice(0, -1).join(".");
    const extension = originalFilename.split(".").slice(-1)[0];
    filename = `${baseName}.${randomId}.${extension}`;
  }

  try {
    await writeFileAsync(
      join(__dirname, "..", "..", "public", filename),
      mediaPayload.data,
      "base64"
    );
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }

  return filename;
};

const processVcardMessage = async (
  messagePayload: MessagePayload
): Promise<void> => {
  if (messagePayload.type !== "vcard") return;

  try {
    const array = messagePayload.body.split("\n");
    const phoneNumbers: Array<{ number: string }> = [];
    let contactName = "";

    array.forEach(line => {
      const values = line.split(":");
      values.forEach((value, index) => {
        if (value.indexOf("+") !== -1) {
          phoneNumbers.push({ number: value });
        }
        if (value.indexOf("FN") !== -1 && values[index + 1]) {
          contactName = values[index + 1];
        }
      });
    });

    await Promise.all(
      phoneNumbers.map(({ number }) =>
        CreateContactService({
          name: contactName,
          number: number.replace(/\D/g, "")
        })
      )
    );
  } catch (error) {
    logger.error("Error processing vcard message:", error);
  }
};

const handleQueueLogic = async (
  whatsappId: number,
  messageBody: string,
  ticket: Ticket,
  contactPayload: ContactPayload
): Promise<void> => {
  const { queues, greetingMessage } = await ShowWhatsAppService(whatsappId);

  if (queues.length === 1) {
    await assignTicketToQueue(ticket, queues[0].id);
    return;
  }

  const selectedOption = messageBody;
  const choosenQueue = queues[+selectedOption - 1];

  if (choosenQueue) {
    await assignTicketToQueue(ticket, choosenQueue.id);

    const body = formatBody(
      `\u200e${choosenQueue.greetingMessage}`,
      contactPayload as any
    );

    try {
      await whatsappProvider.sendMessage(
        whatsappId,
        `${contactPayload.number}@c.us`,
        body
      );
    } catch (error) {
      logger.error("Error sending queue greeting message:", error);
    }
  } else {
    let options = "";
    queues.forEach((queue, index) => {
      options += `*${index + 1}* - ${queue.name}\n`;
    });

    const body = formatBody(
      `\u200e${greetingMessage}\n${options}`,
      contactPayload as any
    );

    const debouncedSentMessage = debounce(
      async () => {
        try {
          await whatsappProvider.sendMessage(
            whatsappId,
            `${contactPayload.number}@c.us`,
            body
          );
        } catch (error) {
          logger.error("Error sending queue options message:", error);
        }
      },
      3000,
      ticket.id
    );

    debouncedSentMessage();
  }
};

// Decide se a mensagem deve ser tratada pelo motor de funil ou pelo agente
// de IA, ANTES do fallback legado (handleQueueLogic). Conexões sem nenhum
// Flow vinculado (whatsapp.flowId null) e tickets sem funil/IA em andamento
// caem em "skip" e seguem exatamente como hoje — sem regressão.
const processIncomingMessageForFlow = async (
  ticket: Ticket,
  whatsapp: Whatsapp,
  body: string
): Promise<"handled" | "skip"> => {
  if (ticket.aiAgentId) {
    EnqueueAiAgentTurnService(ticket.id, body);
    return "handled";
  }

  if (ticket.flowId && ticket.flowNodeId) {
    const waitingNodeType = await getWaitingNodeType(ticket);

    if (waitingNodeType === "question") {
      // Pergunta aberta: junta fragmentos enviados em sequência antes de
      // processar a resposta contra o node atual (ver MessageFragmentBuffer).
      bufferIncomingFragment(ticket.id, body, FLOW_QUESTION_BUFFER_MS, async joinedBody => {
        const freshTicket = await ShowTicketService(ticket.id);
        await advanceFlow(freshTicket, joinedBody);
      });
    } else {
      // Menu: responder na hora é melhor UX do que esperar o buffer.
      await advanceFlow(ticket, body);
    }

    return "handled";
  }

  if (whatsapp.flowId && !ticket.flowId) {
    await startFlow(ticket, whatsapp.flowId);
    return "handled";
  }

  return "skip";
};

export const handleMessage = async (
  messagePayload: MessagePayload,
  contactPayload: ContactPayload,
  contextPayload: WhatsappContextPayload,
  mediaPayload?: MediaPayload
): Promise<void> => {
  try {
    const processedMessage = processLocationMessage(messagePayload);

    const contact = await CreateOrUpdateContactService({
      name: contactPayload.name,
      number: contactPayload.number,
      lid: contactPayload.lid,
      profilePicUrl: contactPayload.profilePicUrl,
      isGroup: contactPayload.isGroup
    });

    let groupContact: Contact | undefined;
    if (contextPayload.groupContact) {
      groupContact = await CreateOrUpdateContactService({
        name: contextPayload.groupContact.name,
        number: contextPayload.groupContact.number,
        lid: contextPayload.groupContact.lid,
        profilePicUrl: contextPayload.groupContact.profilePicUrl,
        isGroup: contextPayload.groupContact.isGroup
      });
    }

    const whatsapp = await ShowWhatsAppService(contextPayload.whatsappId);
    if (
      contextPayload.unreadMessages === 0 &&
      whatsapp.farewellMessage &&
      formatBody(whatsapp.farewellMessage, contact) === processedMessage.body
    ) {
      return;
    }

    // Serializa por contato+conexão: duas mensagens quase simultâneas do
    // mesmo cliente (comum quando ele manda várias mensagens em sequência)
    // não devem conseguir criar dois tickets, nem rodar o motor de
    // funil/fila duas vezes em paralelo antes do primeiro
    // `ticket.update`/`Ticket.create` persistir — por isso todo o trecho
    // que decide/cria o ticket e decide funil/fila fica dentro do lock, não
    // só a criação do ticket isoladamente.
    const ticketLockKey = `ticket-${groupContact ? groupContact.id : contact.id}-${contextPayload.whatsappId}`;

    await withLock(ticketLockKey, async () => {
      const ticket = await FindOrCreateTicketService(
        contact,
        contextPayload.whatsappId,
        contextPayload.unreadMessages,
        groupContact
      );

      const messageData: any = {
        id: processedMessage.id,
        ticketId: ticket.id,
        contactId: processedMessage.fromMe ? undefined : contact.id,
        body: processedMessage.body,
        fromMe: processedMessage.fromMe,
        read: processedMessage.fromMe,
        mediaType: processedMessage.type,
        quotedMsgId: processedMessage.quotedMsgId,
        ack: processedMessage.ack !== undefined ? processedMessage.ack : 0
      };

      // Corpo "efetivo" usado pelo funil/agente de IA/fila — para mensagens
      // de texto é igual a processedMessage.body; para áudio/ptt, é a
      // transcrição (o motor de funil e o agente de IA precisam entender o
      // que a pessoa falou, não só saber que "chegou um áudio").
      let effectiveBody = processedMessage.body;

      if (mediaPayload && processedMessage.hasMedia) {
        const filename = await saveMediaFile(mediaPayload);
        messageData.mediaUrl = filename;
        const [mediaType] = mediaPayload.mimetype.split("/");
        messageData.mediaType = mediaType;

        if (
          !processedMessage.fromMe &&
          (processedMessage.type === "audio" || processedMessage.type === "ptt")
        ) {
          const transcript = await TranscribeAudioService(
            mediaPayload.data,
            mediaPayload.mimetype
          );

          if (transcript) {
            effectiveBody = transcript;
            messageData.body = `🎤 ${transcript}`;
          } else {
            messageData.body = processedMessage.body || filename;
          }
        } else {
          messageData.body = processedMessage.body || filename;
        }
      }

      let lastMessageText = "";
      if (processedMessage.type === "location") {
        lastMessageText = processedMessage.body.includes("Localization")
          ? processedMessage.body
          : "Localization";
      } else {
        lastMessageText = effectiveBody || mediaPayload?.filename || "";
      }

      await ticket.update({ lastMessage: lastMessageText });

      await CreateMessageService({ messageData });

      await processVcardMessage(processedMessage);

      // Ticket com agente de IA ativo continua sendo respondido pelo agente
      // mesmo estando atribuído a um vendedor — o agente só para quando ele
      // mesmo transfere, ou quando o vendedor envia uma mensagem (ver
      // MessageController.store).
      if (
        !contextPayload.groupContact &&
        !processedMessage.fromMe &&
        (ticket.aiAgentId || (!ticket.queue && !ticket.userId))
      ) {
        const outcome = await processIncomingMessageForFlow(
          ticket,
          whatsapp,
          effectiveBody
        );

        if (outcome === "skip" && whatsapp.queues.length >= 1) {
          await handleQueueLogic(
            contextPayload.whatsappId,
            effectiveBody,
            ticket,
            contactPayload
          );
        }
      }
    });
  } catch (err) {
    Sentry.captureException(err);
    logger.error({
      info: "Error handling message",
      err,
      messagePayload,
      contactPayload,
      contextPayload,
      mediaPayload
    });
  }
};

export const handleMessageAck = async (
  messageId: string,
  ack: MessageAck
): Promise<void> => {
  await new Promise(r => setTimeout(r, 500));

  const io = getIO();

  try {
    const messageToUpdate = await Message.findByPk(messageId, {
      include: [
        "contact",
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"]
        }
      ]
    });

    if (!messageToUpdate) {
      return;
    }

    await messageToUpdate.update({ ack });

    io.to(messageToUpdate.ticketId.toString()).emit("appMessage", {
      action: "update",
      message: messageToUpdate
    });
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack: ${err}`);
  }
};
