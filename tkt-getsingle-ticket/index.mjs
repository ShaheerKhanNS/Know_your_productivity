import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const handler = async (event, context, callback) => {
  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  console.log(`event is ${JSON.stringify(event)}`);
  try {
    const params = {
      TableName: "ticket-monitering-table",
      Key: {
        sk: `TCKT#${event.ticketId}`,
        pk: `USER#${event.userId}`,
      },
    };
    const response = await ddbDocClient.send(new GetCommand(params));
    let ticket = response.Item;
    console.log(ticket);
    return {
      status: true,
      message: "success",
      ticket,
    };
  } catch (err) {
    console.log(err);
    return {
      status: false,
      message: "fail",
    };
  }
};
