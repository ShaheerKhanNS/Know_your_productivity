import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const handler = async (event, context, callback) => {
  const client = new DynamoDBClient();
  const docClient = DynamoDBDocumentClient.from(client);

  try {
    const params = {
      TableName: "ticket-monitering-table",
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":pk": `USER#${event.userId}`,
      },
    };
    const command = new QueryCommand(params);
    const { Items } = await docClient.send(command);

    return {
      status: true,
      message: "success",
      tickets: Items,
    };
  } catch (err) {
    console.log(err);
    return {
      status: false,
      message: "fail",
    };
  }
};
