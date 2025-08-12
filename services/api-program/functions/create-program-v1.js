import { success, unsuccessful } from "../../../helpers/responses";

export const main = async (event) => {
  console.log(event);
  const action = "Creación de programa de gira de estudios.";

  const content = {
    sk: "sk",
    user: "user",
    createdAt: "createdAt",
    inProgress: true,
    type: "program",
    status: "pending",
    observation: "observation",
  };

  try {
    return success(200, content, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};