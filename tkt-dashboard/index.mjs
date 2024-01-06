import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const handler = async (event) => {
  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  try {
    const params = {
      TableName: "ticket-monitering-table",
      Key: {
        sk: `USER#${event.userId}`,
        pk: `USR#DETAILS`,
      },
    };

    const user = await ddbDocClient.send(new GetCommand(params));
    const {
      activeTicket,
      activeTicketId,
      openTickets,
      totalHours,
      totalTickets,
      closeTickets,
      idleTickets,
    } = user.Item;
    return {
      status: true,
      activeTicket: Number(`${activeTicket ? 1 : 0}`),
      activeTicketId,
      openTickets,
      totalHours,
      totalTickets,
      closeTickets,
      idleTickets,
    };
  } catch (err) {
    return {
      status: false,
      message: err.__type || "Something went wrong",
      err,
    };
  }
};
