import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  const { ticketId, userId } = event;

  if (!ticketId || !userId) {
    throw new Error("Missing params");
  }
  try {
    const ddbClient = new DynamoDBClient();
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
    const params = {
      TableName: "ticket-monitering-table",
      Key: {
        sk: `TCKT#${event.ticketId}`,
        pk: `USER#${event.userId}`,
      },
      ProjectionExpression: "initialStartedTime",
    };
    const response = await ddbDocClient.send(new GetCommand(params));

    const user = response.Item;
    const { initialStartedTime } = user;

    if (initialStartedTime === 0) {
      await ddbDocClient.send(new DeleteCommand(params));
      return {
        status: true,
        message: "success",
      };
    } else {
      return {
        status: false,
        message: "You had already started working on this ticket😒",
      };
    }
  } catch (err) {
    console.log(JSON.stringify(err));
    return {
      status: false,
      message: "fail",
    };
  }
};
