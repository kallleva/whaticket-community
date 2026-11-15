import Mustache from "mustache";
import Contact from "../models/Contact";

export default (
  body: string,
  contact: Contact,
  extraVariables?: Record<string, unknown>
): string => {
  const view = {
    name: contact ? contact.name : "",
    ...extraVariables
  };
  return Mustache.render(body, view);
};
