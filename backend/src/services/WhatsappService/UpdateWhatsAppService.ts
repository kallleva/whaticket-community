import * as Yup from "yup";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import ShowWhatsAppService from "./ShowWhatsAppService";
import AssociateWhatsappQueue from "./AssociateWhatsappQueue";

interface WhatsappData {
  name?: string;
  status?: string;
  session?: string;
  isDefault?: boolean;
  greetingMessage?: string;
  farewellMessage?: string;
  queueIds?: number[];
  flowId?: number | null;
}

interface Request {
  whatsappData: WhatsappData;
  whatsappId: string;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const UpdateWhatsAppService = async ({
  whatsappData,
  whatsappId
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    status: Yup.string(),
    isDefault: Yup.boolean()
  });

  const {
    name,
    status,
    isDefault,
    session,
    greetingMessage,
    farewellMessage,
    queueIds,
    flowId
  } = whatsappData;

  try {
    await schema.validate({ name, status, isDefault });
  } catch (err) {
    throw new AppError(err.message);
  }

  if ((queueIds?.length ?? 0) > 1 && !greetingMessage) {
    throw new AppError("ERR_WAPP_GREETING_REQUIRED");
  }

  let oldDefaultWhatsapp: Whatsapp | null = null;

  if (isDefault) {
    oldDefaultWhatsapp = await Whatsapp.findOne({
      where: { isDefault: true, id: { [Op.not]: whatsappId } }
    });
    if (oldDefaultWhatsapp) {
      await oldDefaultWhatsapp.update({ isDefault: false });
    }
  }

  const whatsapp = await ShowWhatsAppService(whatsappId);

  // Só grava os campos que vieram de fato no payload — chamadas parciais
  // (ex.: a reconexão de sessão manda só `{ session: "" }`) não podem
  // apagar o resto. O Sequelize grava NULL/`$set([])` pra qualquer campo
  // ausente se a gente não proteger isso explicitamente.
  await whatsapp.update({
    name: name !== undefined ? name : whatsapp.name,
    status: status !== undefined ? status : whatsapp.status,
    session: session !== undefined ? session : whatsapp.session,
    greetingMessage:
      greetingMessage !== undefined ? greetingMessage : whatsapp.greetingMessage,
    farewellMessage:
      farewellMessage !== undefined ? farewellMessage : whatsapp.farewellMessage,
    isDefault: isDefault !== undefined ? isDefault : whatsapp.isDefault,
    flowId: flowId !== undefined ? flowId : whatsapp.flowId
  });

  if (queueIds !== undefined) {
    await AssociateWhatsappQueue(whatsapp, queueIds);
  }

  return { whatsapp, oldDefaultWhatsapp };
};

export default UpdateWhatsAppService;
