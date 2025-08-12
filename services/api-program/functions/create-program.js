import { success, unsuccessful } from "../../../helpers/responses";

export const main = async (event) => {
  console.log(event);
  const action = "Creación de programa de gira de estudios.";

  const { body } = event;
  const programData = JSON.parse(body);

  try {
    return success(200, programData, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
